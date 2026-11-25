import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from '../../../src/screens/home/HomeScreen';
import { Colors } from '../../../src/constants/theme';

export default function HomeTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <HomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
});
