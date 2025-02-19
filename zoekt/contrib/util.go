package contrib

import (
	"os/exec"
	"sync"
	"os"
	"io"
	"bufio"
	"strings"
	"crypto/sha512"
	"encoding/hex"
	"context"
	"time"
	"fmt"
	"log"
	"path/filepath"
	"io/ioutil"

	"github.com/sourcegraph/zoekt"
	"github.com/sourcegraph/zoekt/index"
	"github.com/sourcegraph/zoekt/query"
	"github.com/sourcegraph/zoekt/internal/shards"
	zjson "github.com/sourcegraph/zoekt/internal/json"
	"go.uber.org/automaxprocs/maxprocs"
)

type execOutputProcessor func (proc *exec.Cmd, stdout, stderr io.ReadCloser) error
type execLinesProcessor func (line string)
type execBytesProcessor func (stdout io.ReadCloser)

var (
	DEBUG_ON bool
)

func init() {
	DEBUG_ON = os.Getenv("ZOEKT_DEBUG") != ""
}

func PrintDebugCommand(cmd string) {
	if !DEBUG_ON { return }
	log.Println(cmd)
}

func File2Lines(filename string, fn execLinesProcessor) error {
	f, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fn(scanner.Text())
	}
	if err = scanner.Err(); err != nil {
		return err
	}
	return nil
}

func Exec2Lines(cmd string, fn execLinesProcessor) error {
	return doExec(cmd, func (proc *exec.Cmd, stdout, stderr io.ReadCloser) error {
		if err := proc.Start(); err != nil {
			return err
		}
		listener := &sync.WaitGroup{}
		listener.Add(2)
		go watchTextOutput(proc, listener, stdout, fn)
		go watchTextOutput(proc, listener, stderr, fn)
		listener.Wait()
		return proc.Wait()
	})
}

func watchTextOutput(proc *exec.Cmd, listener *sync.WaitGroup, stream io.ReadCloser, fn execLinesProcessor) {
	defer listener.Done()
	if fn == nil {
		return
	}
	scanner := bufio.NewScanner(stream)
	scanner.Split(bufio.ScanLines)
	for scanner.Scan() {
		m := scanner.Text()
		fn(m)
	}
}

func Exec2Bytes(cmd string, fn execBytesProcessor) error {
	return doExec(cmd, func (proc *exec.Cmd, stdout, _stderr io.ReadCloser) error {
		if err := proc.Start(); err != nil {
			return err
		}
		listener := &sync.WaitGroup{}
		listener.Add(1)
		go watchByteOutput(proc, listener, stdout, fn)
		listener.Wait()
		return proc.Wait()
	})
}

func watchByteOutput(proc *exec.Cmd, listener *sync.WaitGroup, stream io.ReadCloser, fn execBytesProcessor) {
	defer listener.Done()
	if fn == nil {
		return
	}
	fn(stream)
}

func doExec(cmd string, fn execOutputProcessor) error {
	// TEST=1 AND=2 ls -a -l
	// ^      ^     ^  ^--^-- args
	// |      |      \--> cmd
	// \------\-----> env
	argv := strings.Fields(cmd)
	cmdIndex := 0
	for i, value := range argv {
		if !strings.Contains(value, "=") {
			break
		}
		cmdIndex = i + 1
	}
	bin := argv[cmdIndex]
	proc := exec.Command(bin, argv[cmdIndex+1:]...)
	proc.Env = append(os.Environ(), argv[0:cmdIndex]...)
	stdout, err := proc.StdoutPipe()
	if err != nil {
		stdout = nil
	}
	stderr, err := proc.StderrPipe()
	if err != nil {
		stderr = nil
	}
	return fn(proc, stdout, stderr)
}

const BINARY_CHECK_BUF = 4 * 1024 * 1204

func IsBinaryFile(filepath string) (bool, error) {
	f, err := os.Open(filepath)
	if err != nil {
		return true, err
	}
	defer f.Close()
	buf := make([]byte, BINARY_CHECK_BUF /* 4 MB */)
	n, err := f.Read(buf)
	if err != nil {
		return true, err
	}
	if n < BINARY_CHECK_BUF {
		buf = buf[0:n]
	}
	text := string(buf)
	return strings.Contains(text, "\x00"), nil
}

func IsEmptyFolder(filepath string) (bool, error) {
	f, err := os.Open(filepath)
   if err != nil {
      return true, err
   }
   defer f.Close()
   list, err := f.Readdir(1)
   if err != nil {
      return true, err
   }
   return len(list) == 0, nil
}

func IoHash(stream io.ReadCloser) (string, error) {
	h := sha512.New()
	if _, err := io.Copy(h, stream); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func FileHash(filepath string) (string, error) {
	f, err := os.Open(filepath)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha512.New()
	if _, err = io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func IoLen(stream io.ReadCloser) (int64, error) {
	buf := make([]byte, 1024 * 1204 * 1)
	var L int64
	L = 0
	n, err := stream.Read(buf)
	if err != nil { return -1, err }
	L += int64(n)
	for n >= 1024 * 1024 * 1 {
		n, err = stream.Read(buf)
		if err != nil { return -1, err }
		L += int64(n)
	}
	return L, nil
}

func FileLen(filepath string) (int64, error) {
	info, err := os.Stat(filepath)
	if err != nil {
		return -1, err
	}
	return info.Size(), nil
}

func DirList(filepath string) ([]string, error) {
	info, err := os.Stat(filepath)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("not a folder")
	}
	entities, err := ioutil.ReadDir(filepath)
	if err != nil {
		return nil, err
	}
	list := make([]string, len(entities))
	for _, entry := range entities {
		list = append(list, entry.Name())
	}
	return list, nil
}

func PrepareDirectory(dirpath string) error {
	fileinfo, err := os.Stat(dirpath)
	if os.IsNotExist(err) {
		return os.MkdirAll(dirpath, 0755)
	} else if err != nil {
		return err
	} else if !fileinfo.IsDir() {
		return fmt.Errorf("%s has been used as a normal file not a directory", dirpath)
	}
	return nil
}


func Search(indexPath string, ctx context.Context, q string, num int) (*zoekt.SearchResult, error) {
	empty, err := IsEmptyFolder(indexPath)
	if err != nil {
		return nil, err
	}
	if empty {
		return nil, fmt.Errorf("invalid index path")
	}
	PrintDebugCommand(fmt.Sprintf("search in '%s'", indexPath))
	searcher, err := shards.NewDirectorySearcher(indexPath)
	if err != nil {
		return nil, err
	}
	defer searcher.Close()
	Q, err := query.Parse(q)
	sOpts := zoekt.SearchOptions{
		MaxWallTime: 10 * time.Second,
	}
	sOpts.SetDefaults()
	sOpts.NumContextLines = 0
	sOpts.MaxDocDisplayCount = num
	sOpts.DebugScore = DEBUG_ON
	// limit doc number in case there are too many
	// ref: web/server.go
	// sres.Files -> f.LineMatches
	// f.Language, f.Branches, string(f.Checksum), f.Filename, f.Repository
	// f.Version
	// m.LineNumber, m.Line, m.LineFragments -> x
	// x.LineOffset, x.MatchLength
	if err := zjson.CalculateDefaultSearchLimits(ctx, Q, searcher, &sOpts); err != nil {
		return nil, err
	}
	sres, err :=  searcher.Search(ctx, Q, &sOpts)
	if err != nil {
		return nil, err
	}
	return sres, nil
}

// ref: cmd/zoekt-index/main.go

type fileInfo struct {
	name string
	size int64
}

type fileAggregator struct {
	ignoreDirs map[string]struct{}
	sizeMax    int64
	sink       chan fileInfo
}

func (a *fileAggregator) add(path string, info os.FileInfo, err error) error {
	if err != nil {
		return err
	}

	if info.IsDir() {
		base := filepath.Base(path)
		if _, ok := a.ignoreDirs[base]; ok {
			return filepath.SkipDir
		}
	}

	if info.Mode().IsRegular() {
		a.sink <- fileInfo{path, info.Size()}
	}
	return nil
}

func Index(indexPath, sourcePath string, ignoreDirs []string) error {
	_, _ = maxprocs.Set()

	opts := index.Options{}
	opts.SetDefaults()
	opts.IndexDir = indexPath

	ignore := map[string]struct{}{}
	if len(ignoreDirs) > 0 {
		for _, d := range ignoreDirs {
			d = strings.TrimSpace(d)
			if d != "" {
				ignore[d] = struct{}{}
			}
		}
	}

	dir, err := filepath.Abs(filepath.Clean(sourcePath))
	if err != nil {
		return err
	}

	opts.RepositoryDescription.Name = filepath.Base(dir)
	builder, err := index.NewBuilder(opts)
	if err != nil {
		return err
	}
	// we don't need to check error, since we either already have an error, or
	// we returning the first call to builder.Finish.
	defer builder.Finish() // nolint:errcheck

	comm := make(chan fileInfo, 100)
	agg := fileAggregator{
		ignoreDirs: ignore,
		sink:       comm,
		sizeMax:    int64(opts.SizeMax),
	}

	go func() {
		if err := filepath.Walk(dir, agg.add); err != nil {
			log.Fatal(err)
		}
		close(comm)
	}()

	for f := range comm {
		displayName := strings.TrimPrefix(f.name, dir+"/")
		if f.size > int64(opts.SizeMax) && !opts.IgnoreSizeMax(displayName) {
			if err := builder.Add(index.Document{
				Name:       displayName,
				SkipReason: fmt.Sprintf("document size %d larger than limit %d", f.size, opts.SizeMax),
			}); err != nil {
				return err
			}
			continue
		}
		content, err := os.ReadFile(f.name)
		if err != nil {
			return err
		}

		if err := builder.AddFile(displayName, content); err != nil {
			return err
		}
	}

	return builder.Finish()
}
