import { useState } from "react"
import * as ImagePicker from "expo-image-picker"
import * as ImageManipulator from "expo-image-manipulator"
import { Alert, Image, ScrollView, Text, View } from "react-native"

import { api } from "../../services/api"

import { Tip } from "../../components/Tip"
import { Button } from "../../components/Button"
import { Loading } from "../../components/Loading"
import { Item, ItemProps } from "../../components/Item"

import { foodContains } from "../../utils/foodContains"

import { styles } from "./styles"

export function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<ItemProps[]>([])
  const [selectedImageUri, setSelectedImageUri] = useState("")
  const [message, setMessage] = useState("")

  async function foodDetect(imageBase64: string | undefined) {
    const response = await api.post(
      `/v2/models/${process.env.EXPO_PUBLIC_API_MODEL_ID}/versions/${process.env.EXPO_PUBLIC_API_MODEL_VERSION_ID}/outputs`,
      {
        user_app_id: {
          user_id: process.env.EXPO_PUBLIC_API_USER_ID,
          app_id: process.env.EXPO_PUBLIC_API_APP_ID,
        },
        inputs: [
          {
            data: {
              image: {
                base64: imageBase64,
              },
            },
          },
        ],
      }
    )

    const foods = response.data.outputs[0].data.concepts.map((concept: any) => {
      return {
        name: concept.name,
        percentage: `${Math.round(concept.value * 100)}%`,
      }
    })

    const isVegetable = foodContains(foods, "vegetable")
    setMessage(isVegetable ? "" : "Adicione vegetais em seu prato!")

    setItems(foods)
    setIsLoading(false)
  }

  async function handleSelectImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        return Alert.alert(
          "É necessário conceder permissão para acessar seu álbum!"
        )
      }

      setIsLoading(true)

      const response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      })

      if (response.canceled) {
        return setIsLoading(false)
      }

      if (!response.canceled) {
        const imgManipulated = await ImageManipulator.manipulateAsync(
          response.assets[0].uri,
          [{ resize: { width: 900 } }],
          {
            compress: 1,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        )

        setSelectedImageUri(imgManipulated.uri)
        foodDetect(imgManipulated.base64)
      }
    } catch (error) {
      console.log("error", error)
    }
  }

  return (
    <View style={styles.container}>
      <Button onPress={handleSelectImage} disabled={isLoading} />

      {selectedImageUri ? (
        <Image
          source={{ uri: selectedImageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.description}>
          Selecione a foto do seu prato para analisar.
        </Text>
      )}

      <View style={styles.bottom}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {message && <Tip message={message} />}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 24, gap: 12 }}
            >
              {items.map((item) => (
                <View style={styles.items} key={item.name}>
                  <Item data={item} />
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  )
}
