import React from "react";
import MonacoEditor from "@monaco-editor/react";

function Editor(props) {
  const {
    code,
    language,
    setCode
  } = props

  function editorDidMount(editor, monaco) {
    console.log('editorDidMount', editor);
    editor.focus();
  };

  function onChange(newValue, e) {
    setCode(newValue);
  };

  const options = {
    fontSize: 14,
    selectOnLineNumbers: true
  };

  return (
    <MonacoEditor
      loading=""
      width="60vw"
      height="90vh"
      language={language}
      theme="vs-dark"
      value={code}
      options={options}
      onChange={onChange}
      editorDidMount={editorDidMount}
    />
  );
}

export default Editor;