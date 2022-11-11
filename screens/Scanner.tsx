import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  Linking,
  Platform,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Application from "expo-application";
import * as Location from "expo-location";

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [scanned, setScanned] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  let text = "Waiting..";

  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    alert('Scanned')

    let uniqueId;
    if (Platform.OS === "android") {
      uniqueId = Application.androidId;
    }
    if (Platform.OS === "ios") {
      uniqueId = await Application.getIosIdForVendorAsync();
    }

    const regex = /http:\/\/localhost:3000\/assistance\/[0-9]+/gm;
    const validUrl = regex.exec(data);
    if (validUrl && validUrl.length === 1) {
      const qrId = data.replace("http://localhost:3000/assistance/", "");

      const supported = await Linking.canOpenURL(data);

      if (supported) {
        const registerDevice = await fetch(`http://192.168.0.7:8000/register/`, {
          method: "POST",
          body: JSON.stringify({
            id: uniqueId,
          }),
          headers: { "Content-Type": "application/json" },
        });
        const registerDeviceData = await registerDevice.json();

        if (registerDeviceData.status === "success") {
          const response = await fetch(
            `http://192.168.0.7:8000/validate/${qrId}`,
            {
              method: "POST",
              body: JSON.stringify({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                deviceId: uniqueId,
              }),
              headers: { "Content-Type": "application/json" },
            }
          );
          const resData = await response.json();
          alert(
            `DATA: ${data} ID: ${uniqueId} Locación ${JSON.stringify(
              location
            )} ${JSON.stringify(resData)}`
          );
          if (resData.status === "success") {
            await Linking.openURL(
              `http://192.168.0.7:3000/assistance/${resData.data}/${uniqueId}`
            );
          }
        }
      } else {
        alert(`Don't know how to open this URL: ${data}`);
      }
    } else {
      alert("El QR escaneado no pertenece al sistema.");
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
});

export default Scanner;
