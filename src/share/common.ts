export interface SyntaxItem {
   L: number;    // line number
   st: number;
   ed: number;   // line offset for start and end position
   name?: string; // symbol name, flame-editor-<name> is corresponding css
}
