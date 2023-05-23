import React from "react";
import MonacoEditor from "@monaco-editor/react";

function OutputEditor(props) {
    const {
        text,
        setText,
        className
    } = props

    function editorDidMount(editor, monaco) {
        console.log('editorDidMount', editor);
        editor.focus();
    };

    function onChange(newValue, e) {
        setText(newValue);
    };

    const options = {
        selectOnLineNumbers: false,
        lineNumbers: "off",
        fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontSize: 14,
        autoIndent: "full",
        lineHeight: 24,
        wordWrap: "on",
        wrappingIndent: "indent",
        autoClosingQuotes: "always",
        autoClosingBrackets: "always",
        readOnly: true,
        formatOnPaste: true,
        formatOnType: true,
        minimap: { enabled: false },
        renderIndentGuides: false,
        padding: { left: 0, bottom: 0 }
    };

    return (
        <div className={className}>
            <MonacoEditor
                loading=""
                height="90vh"
                theme="vs-dark"
                value={text}
                options={options}
                onChange={onChange}
                editorDidMount={editorDidMount}
            />
        </div>
    );
}

export default OutputEditor;