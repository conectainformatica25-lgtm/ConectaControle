import { Box, Heading, Text, VStack, HStack } from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Alert } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as authService from '@/services/authService';
import * as companyService from '@/services/companyService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export function SettingsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const company = useAuthStore((s) => s.company);
  const setSession = useAuthStore((s) => s.setSession);
  const signOutLocal = useAuthStore((s) => s.signOutLocal);
  const setBrand = useThemeStore((s) => s.setBrand);

  const [logoBase64, setLogoBase64] = useState(
    company?.brand_primary?.startsWith('data:image') ? company.brand_primary : ''
  );
  const [users, setUsers] = useState<{ id: string; full_name: string | null; role: string }[]>([]);

  useEffect(() => {
    companyService.listProfilesForCompany().then(setUsers).catch(() => {});
  }, []);

  async function saveBranding() {
    if (!company) return;
    await companyService.updateCompanyBranding(company.id, {
      brand_primary: logoBase64 || null,
      brand_secondary: null,
      low_stock_threshold: company.low_stock_threshold,
    });
    setBrand({ primary: undefined, secondary: undefined });
    const c = await authService.fetchCompany(company.id);
    if (c && profile) setSession({ profile, company: c });
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64 = result.assets[0].base64;
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        setLogoBase64(`data:${mimeType};base64,${base64}`);
      }
    } catch (error) {
      console.log('Error picking image', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  }

  async function signOut() {
    await authService.signOut();
    signOutLocal();
    router.replace('/(auth)/login');
  }

  return (
    <Screen scroll>
      <VStack space="lg" py="$4">
        <HStack alignItems="center" space="md">
          {router.canGoBack() && (
            <AppButton variant="outline" label="Voltar" onPress={() => router.back()} />
          )}
          <Heading size="lg">Configurações</Heading>
        </HStack>
        <Box>
          <Text fontWeight="$bold">Conta</Text>
          <Text>{profile?.full_name}</Text>
          <Text size="sm" color="$textLight500">
            {profile?.role}
          </Text>
        </Box>
        <Box>
          <Text fontWeight="$bold" mb="$2">
            Logo da Empresa
          </Text>
          <HStack alignItems="center" space="md" mb="$4">
            {logoBase64 ? (
              <Image source={{ uri: logoBase64 }} style={{ width: 80, height: 80, borderRadius: 8, resizeMode: 'contain', backgroundColor: '#f0f0f0' }} />
            ) : (
              <Box width={80} height={80} bg="$backgroundLight200" borderRadius="$md" justifyContent="center" alignItems="center">
                <Text size="xs" color="$textLight500">Sem logo</Text>
              </Box>
            )}
            <AppButton variant="outline" label="Selecionar Logo" onPress={pickImage} />
          </HStack>
          <AppButton label="Salvar alterações" onPress={saveBranding} />
        </Box>
        <Box>
          <Text fontWeight="$bold" mb="$2">
            Equipe
          </Text>
          {users.map((u) => (
            <Text key={u.id} mb="$1">
              {u.full_name ?? u.id} — {u.role}
            </Text>
          ))}
          <Text size="sm" color="$textLight500" mt="$2">
            Novos usuários podem ser convidados pelo painel Supabase ou fluxo futuro de convite.
          </Text>
        </Box>
        <AppButton variant="outline" label="Sair" onPress={signOut} />
      </VStack>
    </Screen>
  );
}
