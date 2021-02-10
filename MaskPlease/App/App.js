import React, { Component } from 'react';
import { StyleSheet, Text, View , Image, AsyncStorage} from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import AppIntroSlider from 'react-native-app-intro-slider';
import { FontAwesome5, Fontisto, MaterialIcons  } from '@expo/vector-icons';
import initialScreen from './screens/initialScreen';
import photoScreen from './screens/PhotoScreen';
import InfoScreen from './screens/InfoScreen';


const AppNavigator = createStackNavigator({
  Initial: {
    screen: initialScreen,
         navigationOptions: {
       title: 'Schermata iniziale',
       headerShown: false
     },
  },

  Photo: {
      screen: photoScreen,
    navigationOptions: {
      title: 'Take Selfie',
      headerShown: false
    },
  },

  Info: {
      screen: InfoScreen,
    navigationOptions: {
      title: 'Take Selfie',
      headerShown: false
    },
  },

},{
        initialRouteName: "Initial"
});

const AppContainer = createAppContainer(AppNavigator);

const slides = [
  {
    key: 's1',
    title: 'Enjoy Maskplease!',
    text: 'L\'idea nasce al fine di tutelare la salute pubblica in'+
    ' periodo di pandemia, invogliando l\'utente al rispetto delle norme in vigore '+
    ' come indossare la mascherina fuori casa.\n\n'+
    'Gli obiettivi di MaskPlease tendono ad uno stampo ludico, competitivo, senza nulla togliere alla serietà delle predisposizioni pandemiche.',
    image: require('./assets/favicon.png'),
    backgroundColor: '#000',
  },
  {
    key: 's2',
    title: 'Il mio RepuScore',
    text: 'E\' un punteggio che misura il tuo senso civico. Il tuo obiettivo consiste '
    + ' nel mantenerlo il più alto possibile, come?\n\n'
    +' Semplicemente scattando un selfie mentre indossi la mascherina appena esci di casa: l\'intelligenza artificiale'
    +' la riconoscerà e ti assegnerà dei RepuPoint.\n\nNon dimenticare di farlo'+
     ' altrimenti il tuo RepuScore inizierà a scendere!',
    image: require('./assets/favicon.png'),
    backgroundColor: '#000',
  },
  {
    key: 's3',
    title: 'Per iniziare',
    text: 'Assicurati di avere il GPS attivo, poi calcola una nuova posizione di casa e avvia il servizio di Tracking dall\'App'
    +' così da poter rilevare lo spostamento.\n\n Quando ti allontani arriverà '+
    ' una notifica e, da quel momento, hai 15 minuti per scattare un selfie.\n\n'+
    'Enjoy MaskPlease!',
    image: require('./assets/favicon.png'),
    backgroundColor: '#000',
  },
];



export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showRealApp: false,
      iSeenTutorial: false,
    };
  }

  async componentDidMount() {
    await this.SeenTutorial();

}


  _renderItem = ({ item }) => {

    let imgOne = undefined;
    let imgTwo = undefined;

    switch (item.key) {
      case "s1":
        imgOne = "shield-virus";
        imgTwo = "lungs-virus";
        break;
      case "s2":
        imgOne = "chart-line";
        imgTwo = "child";
        break;
      case "s3":
        imgOne = "location-arrow";
        imgTwo = "hourglass-start";
        break;
      default:
    }

    return (
      <View  style={styles.container}>
          <Text style={styles.title} >{item.title}</Text>
          <FontAwesome5 name={imgOne} size={80} color="white" />
          <Text style={styles.descr}>{item.text}</Text>
          <FontAwesome5 name={imgTwo} size={80} color="white" />


      </View>
    );
  }

  _renderNextButton = () => {
    return(
    <View style={styles.buttonCircle}>
      <Text style={styles.buttonText}>avanti</Text>
        <Fontisto name="injection-syringe" size={25} color="white" />
    </View>)  };

  _renderDoneButton = () => {
    return(
    <View style={styles.buttonCircle}>
      <Text style={styles.buttonText}>ok</Text>
      <FontAwesome5 name="head-side-mask" size={25} color="white" />
    </View>)
  };

  _onDone = () => {
    this.setState({ showRealApp: true });
    try {
      AsyncStorage.setItem("RepuScore", "50");
      AsyncStorage.setItem("TutorialVisto", "visto");
      AsyncStorage.setItem("DataUscita", "null");

    } catch (error) {
      console.log("Non riesco a salvare lo stato in modo persistente", error);
    }
  };


  _onSkip = () => {
    this.setState({ showRealApp: true });
  };

  SeenTutorial= async () => {
    try {
      AsyncStorage.getItem("TutorialVisto").then((data) => {
        if( data == "visto")
          this.setState({iSeenTutorial: true});
      });

    } catch (error) {
      console.log("Non riesco a salvare lo stato in modo persistente", error);
    }
  };


  render() {
    if (this.state.showRealApp || this.state.iSeenTutorial) {
      return <AppContainer />;
    } else {
      return (
        <AppIntroSlider
          renderItem={this._renderItem}
          data={slides}
          onDone={this._onDone}
          bottomButton = {false}
          renderDoneButton = {this._renderDoneButton}
          renderNextButton={this._renderNextButton}
         />
      );
    }

  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8d6cae',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: '5%',
    marginBottom: '15%',
  },


  title: {
   fontSize: 30,
   padding: 5,
    color: '#e3dfc8',
   fontFamily: 'monospace',
   fontWeight: 'bold',
  },



  descr: {
    fontSize: 17,
   fontFamily: 'monospace',
    textAlign: "center",
  },

  buttonText: {
   fontFamily: 'monospace',
  },

  buttonCircle: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },

});
