import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Profile (placeholder)</Text>
      <Text>We’ll add auth, avatar, name, and settings here.</Text>
      <Button title="Go Home" onPress={() => router.push('/')} />
    </View>
  );
}