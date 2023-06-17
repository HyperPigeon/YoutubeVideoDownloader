import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import ProgressCircle from 'react-native-progress-circle'
import ytdl from 'react-native-ytdl';


export default function DownloadScreen() {
  //const [videoID, setVideoID] = useState('');
  const [url, setURL] = useState('');
  const [percent, setPercent] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState('360p');

  const handleDownloadProgress = ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    const percent = (totalBytesWritten / totalBytesExpectedToWrite) * 100;
    setPercent(percent);
  };
  const handleDownload = async () => {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#\&\?]{11})/;
    const match = url.match(regex);
    const videoId = match && match[1];
    
    const youtubeURL = `http://www.youtube.com/watch?v=${videoId}`;

    let video_quality = 18;
    if(selectedQuality === "480p"){
      video_quality = 135;
    }
    else if(selectedQuality === "720p"){
      video_quality = 136;
    }
    else if(selectedQuality === "1080p"){
      video_quality = 137;
    }

    let title;

    ytdl.getBasicInfo(videoId)
    .then(info => {
      title = info.title;
    })
    .catch(error => {
      console.error('Error:', error);
    });

    const urls = await ytdl(youtubeURL, { quality: `${video_quality}` });
    
    const perm = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
    if (perm.status != 'granted') {
      return;
    }

    let downloadLink = urls[0].url;  

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadLink,
        FileSystem.documentDirectory + `${title}.mp4`,
        {},
        handleDownloadProgress // Callback function to track the progress
      );
      const {uri} = await downloadResumable.downloadAsync();
      const asset = await MediaLibrary.createAssetAsync(uri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (error) {
        console.error(error)
    }
      
  };

  return (
    <View style={styles.container}>

      <View style = {styles.progressCircle}>
        {percent !== 0 &&  <ProgressCircle
          percent={percent}
          radius={50}
          borderWidth={8}
          color="#3399FF"
          shadowColor="#999"
          bgColor="#fff"
        >
          <Text style={{ fontSize: 18 }}>{`${percent.toFixed(0)}%`}</Text>
        </ProgressCircle>}
      </View>

      <Text style={styles.label}>Enter YouTube Video URL:</Text>
      <TextInput
        style={styles.input}
        onChangeText={url => setURL(url)}
        value={url}
      />

      <Text style={styles.label}>Select Video Quality:</Text>
      <Picker
        style={styles.dropdown}
        selectedValue={selectedQuality}
        onValueChange={newQuality => setSelectedQuality(newQuality)}
      >
        <Picker.Item label="360p" value="360p" />
        <Picker.Item label="480p" value="480p" />
        <Picker.Item label="720p" value="720p" />
        <Picker.Item label="1080p" value="1080p" />
      </Picker>

      <TouchableOpacity style={styles.button} onPress={handleDownload}>
          <Text style={styles.buttonText}>Download Video</Text>
      </TouchableOpacity>
    </View>
  );
}



const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: 20,
      marginBottom: 10,
    },
    input: {
      height: 40,
      width: "80%",
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 20,
    },
    dropdown: {
      height: 40,
      width: 200,
    },
    button: {
      backgroundColor: 'blue',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    buttonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    progressCircle: {
      marginBottom: 20
    }
});