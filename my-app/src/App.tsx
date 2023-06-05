import React from 'react';
import './App.css';
import myImage from './teste.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from "react-bootstrap/Form"
import Image from 'react-bootstrap/Image';

function App() {
  return (
    <div id="background">
      <div id="title">
          CIDADE
      </div>
        <div id="content">
            <Image src={myImage} alt="My Image" rounded/>
            <div id="spacer"></div>
            <div id="guess-section">
                <Form.Control
                    id="custom-input"
                />
                <div id="attribute-names">
                    <div className='attribute'>City</div>
                    <div className="attribute">Country</div>
                    <div className="attribute">Continent</div>
                    <div className="attribute">Capital</div>
                    <div className="attribute">Coastal city</div>
                    <div className="attribute">Population</div>
                </div>
            </div>


        </div>

    </div>
  );
}

export default App;
