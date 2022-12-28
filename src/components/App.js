import React, { useState, useEffect } from "react";
import {IoMdSettings} from 'react-icons/io'
import BasicSelect from './BasicSelect.js'
import Editor from './Editor'
import "./App.css"
import getDefaultValue from '../languages/defaultCode'
import {updateDiv} from '../webrtc/test'
import SimplePeer from 'simple-peer';


function App() {
  const [language, setLanguage] = useState('Java')
  const [code, setCode] = useState()
  
  const handleClick = event => {
    
    // Create a new PeerJS connection
    const peer = new SimplePeer({ initiator: true });

    console.log("NEW PEER")

    // Define a function to be called when the peer is ready
    var conn = peer.connect('112');
    // on open will be launch when you successfully connect to PeerServer
    peer.on('open', function(){
      // here you have conn.id
      console.log(conn);
      conn.send('hi!');
    });

    // Define a function to be called when data is received
    peer.on('connection', function(conn) {
      conn.on('data', function(data){
        // Will print 'hi!'
        console.log(data);
      });
    });
  };

  useEffect(() => {
    if(code !== undefined)
      console.log(code)
  }, [code]);


  return (
    <>
    <div className="top">
    <div className="top-left">
      <div className="editor-settings">
        <div className="settings"><IoMdSettings /></div>
        <div className="language">
          <BasicSelect 
          setLanguage={(lang) => setLanguage(lang)}/>
        </div>
      </div>
      <div className="run"><p>Run</p></div>
    </div>
    <div className="top-right">
      <div className="button start" onClick={handleClick}>Start</div>
      <div className="button send">Send</div>
      <div className="button close">Close</div>
    </div>
    </div>
    <Editor
      code={getDefaultValue(language)}
      language={language}
      setCode={(code) => setCode(code)}
    />
  </>
  );
}

export default App;
