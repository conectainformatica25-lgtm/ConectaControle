# Modo demonstração (sem banco)

Com `EXPO_PUBLIC_MOCK=1` no `.env` da raiz do app:

- Dados ficam **apenas na memória** do dispositivo (somem ao fechar o app).
- Login de teste: **demo@demo.com** / **demo**.
- Há produto, cliente e loja de exemplo para navegar no PDV e relatórios.

Para usar PostgreSQL real, remova `EXPO_PUBLIC_MOCK` ou defina `0` e configure `EXPO_PUBLIC_API_URL` ou Supabase.
