function getDefaultValue(language) {
  switch (language) {
    case 'typescript':
      return 'console.log("Hello, World!");';
    case 'javascript':
      return 'console.log("Hello, World!");';
    case 'css':
      return 'body { background-color: yellow; }';
    case 'less':
      return '@color: #ff0;\nbody { background-color: @color; }';
    case 'scss':
      return '$color: #ff0;\nbody { background-color: $color; }';
    case 'json':
      return '{\n  "message": "Hello, World!"\n}';
    case 'html':
      return '<html>\n  <body>\n    <p>Hello, World!</p>\n  </body>\n</html>';
    case 'xml':
      return '<?xml version="1.0"?>\n<message>Hello, World!</message>';
    case 'php':
      return '<?php\n  echo "Hello, World!";\n?>';
    case 'csharp':
      return 'console.WriteLine("Hello, World!");';
    case 'cpp':
      return '#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}';
    case 'razor':
      return '@{\n  ViewData["Message"] = "Hello, World!";\n}';
    case 'markdown':
      return '# Hello, World!\n';
    case 'diff':
      return '--- old/Main.txt\n+++ new/Main.txt\n@@ -1,1 +1,1 @@\n-Hello, World!\n+Hello, World!!\n';
    case 'java':
      return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}';
    case 'vb':
      return 'Module Main\n  Sub Main()\n    Console.WriteLine("Hello, World!")\n  End Sub\nEnd Module';
    case 'coffeescript':
      return 'console.log "Hello, World!"';
    case 'handlebars':
      return '<p>Hello, World!</p>';
    case 'batch':
      return '@echo off\n\necho Hello, World!\n';
    case 'pug':
      return 'p Hello, World!';
    case 'fsharp':
      return 'printfn "Hello, World!"';
    case 'lua':
      return 'print("Hello, World!")';
    case 'powershell':
      return 'Write-Output "Hello, World!"';
    case 'python':
      return 'print("Hello, World!")';
    case 'ruby':
      return 'puts "Hello, World!"';
    case 'sass':
      return '$color: #ff0;\nbody { background-color: $color };';
    case 'r':
      return 'print("Hello, World!")';
    case 'objective-c':
      return '#import <Foundation/Foundation.h>\n\nint main(int argc, const char * argv[]) {\n  @autoreleasepool {\n    NSLog(@"Hello, World!");\n  }\n  return 0;\n}';
    default:
      return 'choose a valid language from the dropdown above';
  }
}

export default getDefaultValue;