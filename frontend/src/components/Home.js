
import "./Home.css"
import React, { useState } from "react";

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
                    {invitationCode.length > 0 ? (
                        <a href={"/room?id=" + invitationCode}>
                            <button className="button">Join an interview</button>
                        </a>
                    ) : (
                        <a>
                            <button className="button" disabled>Join an interview</button>
                        </a>
                    )}
                </div>
            </div>
        </div >
    )
}

export default Index