// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  // React Native usa Metro bundler para resolução de módulos — o resolver Node.js
  // do ESLint não consegue resolver pacotes nativos (.native.js, platform-specific,
  // etc.). Desabilitar import/no-unresolved é o padrão correto para projetos RN/Expo.
  {
    rules: {
      "import/no-unresolved": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*/apps/api/*", "**/apps/api/**"],
              message:
                "Mobile não pode importar da API. Use @toqe/shared ou @toqe/contracts.",
            },
            {
              group: ["*/apps/web/*", "**/apps/web/**"],
              message: "Mobile não pode importar do web.",
            },
          ],
        },
      ],
    },
  },
  // react-hooks@7 (trazido por eslint-config-expo@56) adiciona regras do React
  // Compiler que são false-positives para padrões legítimos neste projeto:
  //
  // react-hooks/immutability — Reanimated useSharedValue() retorna objetos
  //   intencionalmente mutáveis via .value. O React Compiler não reconhece a
  //   diferença entre SharedValues e state comum; desabilitar evita falsos positivos
  //   que nunca serão corrigíveis sem mudar a API do Reanimated.
  //
  // react-hooks/refs — React Native Animated usa useRef(new Animated.Value()).current
  //   como padrão canônico para obter o Animated.Value estável. Essa não é uma ref de
  //   DOM cujo .current pode ser null durante render; é um valor de animação que existe
  //   desde a primeira renderização. O aviso é um false-positive para RN Animated.
  //
  // react-hooks/set-state-in-effect — O padrão de inicializar estado local com dados
  //   de query (useEffect(() => { if (data && !local) setLocal(data) }, [data])) é
  //   documentado pelo React para derived state e não causa cascata porque o guard
  //   `!local` garante que roda apenas uma vez. A regra é over-eager aqui.
  {
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Em arquivos de teste:
  // - jest.mock() é hoistado pelo babel-jest antes dos imports
  //   → import/first não pode entender essa ordem
  // - jest.mock factories hoistadas só podem referenciar módulos via require()
  //   ou jest.requireActual() — top-level imports não estão disponíveis ainda
  //   → @typescript-eslint/no-require-imports vira false-positive nesse contexto
  // - react-hooks/globals: padrão de teste AuthSpy expõe estado interno via
  //   `let externalAuth = null` + atribuição dentro do componente para asserções —
  //   é um padrão intencional e correto em testes, não um bug de escopo.
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "import/first": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/globals": "off",
    },
  },
]);
