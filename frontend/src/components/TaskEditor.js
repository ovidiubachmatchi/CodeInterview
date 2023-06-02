import React from "react";
import MonacoEditor from "@monaco-editor/react";

function TaskEditor(props) {
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
        scrollbar: {
            vertical: "hidden",
            horizontal: "hidden",
            handleMouseWheel: false,
        },
        autoClosingQuotes: "always",
        autoClosingBrackets: "always",
        formatOnPaste: true,
        formatOnType: true,
        minimap: { enabled: false },
        renderIndentGuides: false, // Dezactivează delimitatorii de indentare
        padding: { left: 0, bottom: 0 }, // Elimină padding-ul din partea de sus și de jos a editorului
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

export default TaskEditor;