import React from 'react'
import "./Home.css"
import { useNavigate } from "react-router-dom";

function Index() {

    let navigate = useNavigate();
    const routeChange = () => {
        let invitationCode = document.querySelector('input').value;
        let path = `/room?id=${invitationCode}`;
        if (invitationCode)
            navigate(path);
    }

    const startInterview = () => {
        let id = Math.random().toString(36).substring(2, 7);
        let path = `/room?id=${id}`;
        navigate(path);
    }

    return (
        <div id="background" style={{ backgroundImage: `url('/pattern.png')` }}>
            <div id="left">
                <h1 id="title">Code <br /> Interview</h1>
                <button className="button" onClick={startInterview}>Start an interview</button>

            </div>
            <div id="middle">
                <img src={"./poza1.png"} alt="poza1" />
            </div>
            <div id="right">

                <label>
                    <input className='button' type="text" placeholder='Invitation code' />
                </label>
                {/* // make this button redirect to /room?id=invitationCode */}
                <button className="button" onClick={routeChange}>Join an interview</button>
            </div>
        </div>
    )
}

export default Index