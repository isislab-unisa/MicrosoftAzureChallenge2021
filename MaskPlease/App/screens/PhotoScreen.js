import React, { useState, useEffect } from 'react';
import {Button, Image, StyleSheet, Text, View, Alert, TouchableOpacity, AsyncStorage } from 'react-native';
import { Camera } from 'expo-camera';
import { FontAwesome ,  MaterialIcons, AntDesign} from '@expo/vector-icons';
import { EAzureBlobStorageImage } from 'react-native-azure-blob-storage';

import logo from '../assets/logo.png';

export default function PhotoScreen(props) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front)
  const [UriImg, setNewUri] = useState(null);
  const [token, setToken] = useState(null);
  const [isAzureTalk, setCommAzure] = useState(false);
  const [isBlockPhoto, setBlockPhoto] = useState(false);

  useEffect(() => {
      EAzureBlobStorageImage.configure(
    "",   //Account Name
    "",  //Account Key
    ""  //Container Name
  );

  }, []);


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }




snap = async () => {
  let options = { quality: 0.4};
  if (this.camera) {
    let photo = await this.camera.takePictureAsync(options).then(data => {
                    setNewUri(data.uri);
                  });
  }
};



upload = async () => {

  setBlockPhoto(true);
  setCommAzure(true);

  var nomeFile = await EAzureBlobStorageImage.uploadFile(UriImg);
  setToken(nomeFile);

  // polling ogni 1,5 secondi x 15 volte
  let i = 0
  const intervalId = setInterval(async () => {
    let risp = await polling();
      if(risp == 250){
        Alert.alert('Mascherina non riconosciuta ... + 0 RepuPoint 😅 ');
        console.log("Mascherina non riconosciuta");
        props.navigation.state.params.updateData("NO MASK");
        clearInterval(intervalId);
        return;
      }
      if(risp == 251){
        Alert.alert('Mascherina rilevata! +3 RepuPoints 🥳');
        console.log("Mascherina rilevata!");
        props.navigation.state.params.updateData("OK MASK");
        incrementRepuScore();
        clearInterval(intervalId);
        return;
      };

    if(i >= 20){
      Alert.alert('Non riesco a ricevere una risposta dal server 😑');
      props.navigation.state.params.updateData("Error");
      clearInterval(intervalId);
      return;
    }
    i = i + 1;
  }, 2000);

};


polling = async () => {
  let query = '' // endPoint con Key getStatus
  const response = await fetch(query, {method: "GET"});
  return response.status;
};


incrementRepuScore = async () => {
  let OldScore = await AsyncStorage.getItem("RepuScore");
  let newScore = parseInt(OldScore) + 3;
  if(newScore > 100) newScore = 100;
  AsyncStorage.setItem("RepuScore", String(newScore));

};


  return (
    <View style={styles.container}>

    <View style={styles.TopView}>
       <Image source={logo} style={{width: '50%', height: '50%'}} />
    </View >


      <Camera style={styles.camera} type={type}
          ref={ref => {
            this.camera = ref;
          }}>
      </Camera>

      <View style={styles.BottomView}>
        <View style={{width: '80%', height: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around' }}>
          <TouchableOpacity onPress ={() => {
            setType(
              type === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            );
          }}>
          <MaterialIcons name="flip-camera-android" size={40} color="black" />
          </TouchableOpacity>
          <TouchableOpacity disabled={isBlockPhoto}  onPress={snap}><FontAwesome name="camera-retro" size={40} color={isBlockPhoto? 'rgba(0, 0, 0, .2)' : 'black'} /></TouchableOpacity>
          <TouchableOpacity  disabled={UriImg == null || isAzureTalk ? true : false} onPress={upload}><AntDesign name="cloudupload" size= {40} color={UriImg == null || isAzureTalk? 'rgba(0, 0, 0, .2)' : 'black'} /></TouchableOpacity>
        </View>
      </View >

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 9,
  },

  TopView:{
    paddingTop: '5%',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8d6cae',
    flex: 1,
  },

  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  button: {
    flex: 0.1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },


  BottomView:{
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '10%',
    alignItems: 'center',
    backgroundColor: '#8d6cae',
     borderTopLeftRadius: 60,
     borderTopRightRadius: 60,
  },

});
