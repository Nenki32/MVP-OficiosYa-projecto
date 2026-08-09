import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '../src/auth/AuthContext'
import { colors } from '../src/theme'

/**
 * Pantalla de entrada: decide adonde va el usuario segun tenga o no sesion.
 * No dibuja nada propio mas que el spinner mientras se restaura la sesion.
 */
export default function Index() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <Redirect href={usuario ? '/(tabs)' : '/login'} />
}
