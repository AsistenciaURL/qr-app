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

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    let uniqueId
    if (Platform.OS === "android") {
      uniqueId = Application.androidId;
    }
    if (Platform.OS === "ios") {
      uniqueId = await Application.getIosIdForVendorAsync();
    }
    alert(`DATA: ${data} ID: ${uniqueId}`);
    // const supported = await Linking.canOpenURL(data);

    // if (supported) {
    //   await Linking.openURL(data);
    // } else {
    //   alert(`Don't know how to open this URL: ${data}`);
    // }
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
