import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from "react-bootstrap/Form"
import Image from 'react-bootstrap/Image';
import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {collection, getDocs, getFirestore, query, where} from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';
import { ReactComponent as Info } from './info.svg';
import { ReactComponent as Stats } from './stats.svg';



const firebaseConfig = {
    apiKey: "AIzaSyArdtK9qgQQfHJD2YXU3oItAlXZy3VVym0",
    authDomain: "city-guesser-4f5f2.firebaseapp.com",
    projectId: "city-guesser-4f5f2",
    storageBucket: "city-guesser-4f5f2.appspot.com",
    messagingSenderId: "691475393828",
    appId: "1:691475393828:web:8ed415efdde4b346f197b1",
    measurementId: "G-38SNKLJCX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app)
const storage = getStorage(app)

const cityList: string[] = ["Lisbon, Portugal", "Porto, Portugal", "Grenoble, France"]
const citySet: Set<string> = new Set<string>()
citySet.add("lisbon")
citySet.add("porto")
citySet.add("grenoble")

interface CityDoc {
    id: string
    city: string
    continent: string
    country: string
    isCapital: boolean
    isCoastal: boolean
    population: number
    randomId: number
}



function App() {

    const [guessed, setGuessed] = useState(false)

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [showStats, setShowStats] = useState(false);
    const handleCloseStats = () => setShowStats(false);
    const handleShowStats = () => setShowStats(true);

    const [showInfo, setShowInfo] = useState(false);
    const handleCloseInfo = () => setShowInfo(false);
    const handleShowInfo = () => setShowInfo(true);

    const inputRef = useRef(null);
    const [inputValue, setInputValue] = useState('');
    const [guessList, setGuessList] = useState([]);
    const [cityDoc, setCityDoc] = useState<CityDoc | null>(null); // Initialize cityDoc as null
    const [cityListState, setCityListState] = useState(cityList);
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const doc = await getRandomCityId(firestore)
                setCityDoc({
                    id: doc.id,
                    city: doc.get('city'),
                    continent: doc.get('continent'),
                    country: doc.get('country'),
                    isCapital: doc.get('isCapital'),
                    isCoastal: doc.get('isCoastal'),
                    population: doc.get('population'),
                    randomId: doc.get('randomId')
                })

                getDownloadURL(ref(storage, 'cities/' + doc.get('city').toLowerCase() + '.png')).then((url) => {
                    // @ts-ignore
                    setImageUrl(url)
                })
            } catch (error) {
                console.error("An error occurred:", error);
            }
        };

        fetchData();
    }, []);

    const handleKeyPress = async (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !guessed) {
            let cityGuess = inputValue.trim().toLowerCase()

            if(cityGuess.includes(",")){
                cityGuess = cityGuess.split(",")[0]
            }
            if (citySet.has(cityGuess)) {
                setInputValue('')
                setCityListState(cityList)

                let guess: Guess
                // @ts-ignore
                if (cityDoc.city.toLowerCase() === cityGuess) {
                    // @ts-ignore
                    guess = {
                        population: 0,
                        coastal: true,
                        capital: true,
                        continent: true,
                        country: true,
                        city: true,
                        populationText: cityDoc!.population,
                        coastalText: cityDoc!.isCoastal,
                        capitalText: cityDoc!.isCapital,
                        continentText: cityDoc!.continent,
                        countryText: cityDoc!.country,
                        cityText: cityDoc!.city
                    }
                    // @ts-ignore
                    handleShow()
                    setGuessed(true)

                    // Update number of wins
                    const numberWins = localStorage.getItem('numberWins')
                    let newNumberWins = numberWins!==null?parseInt(numberWins)+1:1
                    localStorage.setItem('numberWins', String(newNumberWins))

                } else {
                    const querySnapshot = await getDocs(query(collection(firestore, 'city-collection'),
                        where('city', '==', capitalizeFirstLetter(cityGuess))))

                    const document = querySnapshot.docs[0]

                    guess = {
                        population: document.get('population') - cityDoc!.population,
                        coastal: document.get('isCoastal') === cityDoc!.isCoastal,
                        capital: document.get('isCapital') === cityDoc!.isCapital,
                        continent: document.get('continent') === cityDoc!.continent,
                        country: document.get('country') === cityDoc!.country,
                        city: false,
                        populationText: document.get('population'),
                        coastalText: document.get('isCoastal'),
                        capitalText: document.get('isCapital'),
                        continentText: document.get('continent'),
                        countryText: document.get('country'),
                        cityText: document.get('city')
                    }
                }
                // @ts-ignore
                const auxList = []
                auxList.push(<GuessCard guess={guess}></GuessCard>)
                // @ts-ignore
                setGuessList(auxList.concat(guessList))
                // Update number of guesses
                const numberGuesses = localStorage.getItem('numberGuesses')
                let newNumberGuesses = numberGuesses!==null?parseInt(numberGuesses)+guessList.length:guessList.length
                localStorage.setItem('numberGuesses', String(newNumberGuesses))
            }
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInputValue(event.target.value);
        const auxList: string[] = []
        cityList.forEach(
            (item) => {
                if (item.toLowerCase().includes(event.target.value.toLowerCase())) {
                    auxList.push(item)
                }
            }
        )
        setCityListState(auxList)
    };

        const [selectedItem, setSelectedItem] = useState(null);

        const handleItemClick = (item: string | React.SetStateAction<null>) => {
            // @ts-ignore
            setSelectedItem(item);
            // @ts-ignore
            setInputValue(item)
            // @ts-ignore
            inputRef.current.focus()
        };

        const handleButtonClick = () => {
            handleClose()
            window.location.reload()
        }


  // @ts-ignore
    return (

    <div id="background">
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>You won</Modal.Title>
            </Modal.Header>
            <Modal.Body>It only took you {guessList.length} {guessList.length===1?'try':'tries'}!</Modal.Body>
            <Modal.Footer>
                <Button variant="success" onClick={handleButtonClick}>
                    Play again
                </Button>
            </Modal.Footer>
        </Modal>
        <Modal show={showStats} onHide={handleCloseStats}>
            <Modal.Header closeButton>
                <Modal.Title>Your stats</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                You have won {localStorage.getItem('numberWins')} times!
                <br/>
                You need an average of {
                (localStorage.getItem('numberGuesses')===null || localStorage.getItem('numberWins')===null)?
                    // @ts-ignore
                0:(parseInt(localStorage.getItem('numberGuesses'))/parseInt(localStorage.getItem('numberWins'))).toFixed(1)
                } guesses to win!
            </Modal.Body>
        </Modal>
        <Modal show={showInfo} onHide={handleCloseInfo}>
            <Modal.Header closeButton>
                <Modal.Title>Information</Modal.Title>
            </Modal.Header>
            <Modal.Body>Guess the city to win!</Modal.Body>
        </Modal>
      <div id="title" onClick={() => window.location.reload()}>
          CIDADE
      </div>
        <div id="content">
            {imageUrl===null?
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>:
                <Image src={imageUrl} alt="My Image" id="image" rounded/>
            }
            <div id="guess-section">
                <div id="suggestion-list" className="scrollable-container">
                    {cityListState.map((item, index) => (
                        <div key={index}
                             className={`suggestion ${selectedItem === item ? 'highlighted' : ''}`}
                             onClick={() => handleItemClick(item)}>{item}</div>
                    ))}
                </div>
                <Form.Control id="custom-input"
                              placeholder={'Enter city'}
                              value={inputValue}
                              onKeyPress={(e) => handleKeyPress(e)}
                              onChange={(e) => handleChange(e)}
                              ref={inputRef}
                />
                <div id="attribute-names">
                    <div className="attribute">City</div>
                    <div className="attribute">Country</div>
                    <div className="attribute">Continent</div>
                    <div className="attribute">Capital</div>
                    <div className="attribute">Coastal city</div>
                    <div className="attribute">Population</div>
                </div>
                <div id="guess-list">
                    {guessList}
                </div>
            </div>
        </div>
        <div id="icon-list">
            <Info className="icon" onClick ={() => handleShowInfo()}></Info>
            <Stats className="icon" onClick ={() => handleShowStats()}></Stats>
        </div>
    </div>
  );
}

interface Guess {
    population: number;
    coastal: boolean;
    capital: boolean;
    continent: boolean;
    country: boolean;
    city: boolean;
    populationText: number;//TODO population formatter
    coastalText: boolean;
    capitalText: boolean;
    continentText: string;
    countryText: string;
    cityText: string;
}

function GuessCard(props: {
    guess: Guess
    }) {

    let populationAnswer = false
    let populationNum = ""
    if(props.guess.population > 0){
        populationNum = " ↓"
    }
    else if(props.guess.population < 0){
        populationNum = " ↑"
    }
    else{
        populationAnswer = true
    }


    return(
        <div id="attribute-names-answer">
            <div className={"attribute-answer ".concat(
                props.guess.city?"attribute-answer-right":"attribute-answer-wrong")}>{props.guess.cityText}
            </div>
            <div className={"attribute-answer ".concat(
                props.guess.country?"attribute-answer-right":"attribute-answer-wrong")}>{props.guess.countryText}
            </div>
            <div className={"attribute-answer ".concat(
                props.guess.continent?"attribute-answer-right":"attribute-answer-wrong")}>{props.guess.continentText}
            </div>
            <div className={"attribute-answer ".concat(
                props.guess.capital?"attribute-answer-right":"attribute-answer-wrong")}>{props.guess.capitalText?'Yes':'No'}
            </div>
            <div className={"attribute-answer ".concat(
                props.guess.coastal?"attribute-answer-right":"attribute-answer-wrong")}>{props.guess.coastalText?'Yes':'No'}
            </div>
            <div className={"attribute-answer ".concat(
                populationAnswer?"attribute-answer-right":"attribute-answer-wrong")}>
                {props.guess.populationText.toString().concat(populationNum)}
            </div>
        </div>
    )
}

async function getRandomCityId(firestore: any) {
    const cityCollection = collection(firestore, 'city-collection')
    const snapshot = await getDocs(cityCollection)
    const collectionSize = snapshot.docs.length
    const randomId = Math.floor(Math.random() * collectionSize);

    const querySnapshot = await getDocs(query(cityCollection, where('randomId', '==', randomId)))
    return querySnapshot.docs[0]
}

function capitalizeFirstLetter(string: string): string {
    const firstLetter = string.charAt(0).toUpperCase();
    const restOfString = string.slice(1).toLowerCase();

    return firstLetter + restOfString;
}

export default App;
