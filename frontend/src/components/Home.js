
import "./Home.css"
import React, { useEffect, useState } from "react";
import { redirect, useNavigate } from "react-router-dom";



function Index() {

    const [invitationCode, setInvitationCode] = useState("");

    return (
        <div id="background" style={{ backgroundImage: `url('/pattern.png')` }}>
            <div id="left">
                <h1 id="title">Code <br /> Interview</h1>
                <a href={"/room?id=" + Math.random().toString(36).substring(2, 7)}>
                    <button className="button">Start an interview</button>
                </a>
            </div>
            <div id="middle">
                <img src={"./poza1.png"} alt="poza1" />
            </div>
            <div id="right">
                <div id="right-box">
                    <input className='button input' onChange={e => setInvitationCode(e.target.value)} type="text" placeholder='Invitation code' />
                    <a href={"/room?id=" + invitationCode}>
                        <button className="button">Join an interview</button>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Index