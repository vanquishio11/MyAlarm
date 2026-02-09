/**
 * Alarm ring: sound (loop) and vibration.
 * start() begins ring; stop() stops it. Safe to call stop() when not ringing.
 */

import { Audio } from "expo-av";
import { Vibration, Platform } from "react-native";

let soundInstance = null;
let vibrateInterval = null;

const VIBRATE_PATTERN = [0, 500, 200, 500]; // pause, vibrate, pause, vibrate (repeat)

/**
 * Start ringing: play sound (loop) and optionally vibrate.
 * @param {{ vibrate?: boolean, soundSource?: number }} options - soundSource = require('./alarm.mp3')
 */
export async function start(options = {}) {
  const { vibrate = true, soundSource } = options;
  await stop();

  if (vibrate && Platform.OS !== "web") {
    vibrateInterval = setInterval(() => {
      Vibration.vibrate(VIBRATE_PATTERN);
    }, 2000);
  }

  if (soundSource) {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(soundSource, {
        isLooping: true,
      });
      soundInstance = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn("AlarmRinger: could not play sound", e);
    }
  }
}

/**
 * Stop sound and vibration.
 */
export async function stop() {
  if (vibrateInterval) {
    clearInterval(vibrateInterval);
    vibrateInterval = null;
  }
  if (Platform.OS !== "web") {
    try {
      Vibration.cancel();
    } catch (_) {}
  }
  if (soundInstance) {
    try {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
    } catch (_) {}
    soundInstance = null;
  }
}
