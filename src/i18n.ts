// Multi-language support. Scope, per explicit direction: device-panel
// "chrome" (EXIT, READY, HEARING CHECK, MODEL HC-1 · AUDIOMETRIC SELF-TEST,
// SUBMIT, PASSWORD, Name) stays hardcoded English in every locale — it's
// meant to read like a real audio instrument's fixed panel labels, not
// app UI text — so none of that lives in this dictionary. Everything here is
// actual instructional/explanatory copy, translated per locale.
export type Locale = 'ja' | 'en' | 'zh' | 'de' | 'ko' | 'es' | 'fr' | 'pt';

export const SUPPORTED_LOCALES: Locale[] = ['ja', 'en', 'zh', 'de', 'ko', 'es', 'fr', 'pt'];

// Each language's own native name — used in the in-app language switcher's
// dropdown so a viewer can recognize their own language even without
// reading any of the others (the switcher's closed-state button shows the
// bare locale code instead, e.g. "EN", matching the app's device-panel
// monospace-code aesthetic).
export const LANGUAGE_LABELS: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  de: 'Deutsch',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
};

// English, not Japanese, is the fallback for a browser/OS language this app
// doesn't otherwise recognize — Japanese stays available for anyone whose
// language actually matches it, but an unmatched user should land on the
// most broadly-readable option for a professional-audio audience, not a
// language they likely can't read at all.
export const DEFAULT_LOCALE: Locale = 'en';

// 'pt' covers Brazilian Portuguese specifically (per explicit direction —
// Brazil's App Store market, not Portugal's) but matches any pt-* tag the
// same way 'zh' doesn't distinguish simplified/traditional — one variant
// per language, consistent with the rest of this list.
function normalizeToSupportedLocale(tag: string): Locale | null {
  const lower = tag.toLowerCase();
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('pt')) return 'pt';
  if (lower.startsWith('en')) return 'en';
  return null;
}

// `?lang=xx` override matches the existing `?mobile`/`?ipad` pattern (see
// main.ts) — lets any language be previewed from any browser without relying
// on OS/browser language settings. Falls back through navigator.languages
// (the user's full ranked preference list, not just the top one) before
// landing on DEFAULT_LOCALE.
export function detectLocale(): Locale {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get('lang');
  if (forced) {
    const normalized = normalizeToSupportedLocale(forced);
    if (normalized) return normalized;
  }
  const candidates = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    const normalized = normalizeToSupportedLocale(tag);
    if (normalized) return normalized;
  }
  return DEFAULT_LOCALE;
}

type Vars = Record<string, string | number>;

// Flat dot-namespaced keys (screen.thing), one full sentence/phrase per key
// per locale — deliberately NOT composed word-by-word across languages
// (e.g. "{{side}}" + "耳" concatenation), since word order/grammar differs
// too much between ja/en/zh/de/ko/es for that to hold up. `{{var}}` markers
// substitute in vars that are themselves already-localized strings (e.g.
// intro.bullet3's {{btn}} pulls in the already-translated measure.heardButton
// label, so the button name only has to be translated once).
const DICTIONARY: Record<Locale, Record<string, string>> = {
  ja: {
    'gate.passwordError': 'パスワードが違います',
    'nav.back': '戻る',
    'nav.stop': '緊急停止',
    'nav.heading': '聴力チェック',
    'nav.resultTitle': '測定結果',
    'nav.partialWarning': '※途中で停止したため、一部の周波数は未測定です',
    'intro.title': '簡易聴力チェック',
    'intro.bullet1': '・ヘッドホンまたはイヤホンを装着してください',
    'intro.bullet2': '・右耳→左耳の順に、低い音から高い音まで自動で測定します',
    'intro.bullet3': '・音が聞こえたら「{{btn}}」ボタンを押してください',
    'intro.bullet4': '・聞こえない場合は何もしなくて大丈夫です（自動的に次に進みます）',
    'intro.bullet5': '・所要時間の目安は3〜5分です',
    'intro.bullet6': '・体調に異変を感じたら、いつでも「{{stopBtn}}」で中断できます',
    'intro.disclaimer': '※使用機器の音量設定に依存する相対的な簡易チェックです。医療機関の聴力検査の代わりにはなりません。',
    'intro.startButton': 'はじめる',
    'intro.spaceKeyHint': '（Spaceキー）',
    'setup.title': '測定環境を選択してください',
    'setup.deviceLabel': '再生機器',
    'setup.listeningLabel': '音質の特性',
    'setup.deviceHeadphone': 'ヘッドホン',
    'setup.deviceEarphone': 'イヤホン',
    'setup.listeningReference': 'リファレンスクオリティ\n（フラットな特性）',
    'setup.listeningType': 'リスニングタイプ\n（低音、高音が豊かな特性）',
    'setup.confirmButton': 'OK（音が出ます）',
    'calibrate.title': '音量を調整してください',
    'calibrate.body':
      '1kHzの基準音が鳴り続けています。<br/>ヘッドホン/イヤホンの音量を、無理なくはっきり聞き取れる<br/>「ちょうど良い」大きさに調整してください。<br/>調整後は測定が終わるまで機器の音量を変更しないでください。',
    'calibrate.confirmButton': 'この音量で測定を始める',
    'measure.status': '{{ear}} 測定中 / {{freq}}',
    'measure.heardButton': '聞こえたら押す',
    'measure.hint': '聞こえなければ何もしなくて大丈夫です',
    'ear.right': '右耳',
    'ear.left': '左耳',
    'done.date': '測定日',
    'done.namePlaceholder': '任意',
    'done.nameEmpty': '（未記入）',
    'done.pdfButton': 'PDFで保存',
    'done.saveButton': '結果を保存',
    'done.saveAsImage': '画像で保存',
    'done.disclaimer':
      '※相対値による簡易チェックです。使用機器での聞こえ方の左右差・帯域バランスの目安としてご覧ください。医療機関の聴力検査とは異なる簡易的な指標です。',
    'print.title': '聴力チェック 測定結果',
    'print.subtitle': '簡易セルフチェック（相対値）',
    'print.disclaimer':
      '※相対値による簡易チェックです。使用機器での聞こえ方の左右差・帯域バランスの目安としてご覧ください。医療機関の聴力検査とは異なる簡易的な指標です。',
  },
  en: {
    'gate.passwordError': 'Incorrect password',
    'nav.back': 'Back',
    'nav.stop': 'Emergency Stop',
    'nav.heading': 'Hearing Check',
    'nav.resultTitle': 'Results',
    'nav.partialWarning': '※Stopped early — some frequencies were not measured.',
    'intro.title': 'Quick Hearing Check',
    'intro.bullet1': '・Put on your headphones or earphones.',
    'intro.bullet2': '・Measurement runs automatically: right ear then left ear, low to high frequency.',
    'intro.bullet3': '・When you hear the tone, press the "{{btn}}" button.',
    'intro.bullet4': "・If you don't hear it, no action is needed — it moves on automatically.",
    'intro.bullet5': '・Takes about 3–5 minutes.',
    'intro.bullet6': '・If you feel unwell, you can stop anytime with "{{stopBtn}}".',
    'intro.disclaimer':
      "※This is a relative, simplified check dependent on your device's volume setting. It is not a substitute for a clinical hearing test.",
    'intro.startButton': 'Start',
    'intro.spaceKeyHint': '(Space key)',
    'setup.title': 'Select your listening setup',
    'setup.deviceLabel': 'Playback device',
    'setup.listeningLabel': 'Sound character',
    'setup.deviceHeadphone': 'Headphones',
    'setup.deviceEarphone': 'Earphones',
    'setup.listeningReference': 'Reference quality\n(flat response)',
    'setup.listeningType': 'Consumer type\n(boosted bass & treble)',
    'setup.confirmButton': 'OK (sound will play)',
    'calibrate.title': 'Adjust the volume',
    'calibrate.body':
      'A 1kHz reference tone is playing continuously.<br/>Adjust your headphone/earphone volume to a level that\'s<br/>clearly audible without strain — a comfortable "just right" level.<br/>Please don\'t change the device volume again until the test is finished.',
    'calibrate.confirmButton': 'Start the test at this volume',
    'measure.status': 'Testing: {{ear}} / {{freq}}',
    'measure.heardButton': 'Press when heard',
    'measure.hint': "If you don't hear it, no action is needed.",
    'ear.right': 'Right ear',
    'ear.left': 'Left ear',
    'done.date': 'Date',
    'done.namePlaceholder': 'optional',
    'done.nameEmpty': '(not entered)',
    'done.pdfButton': 'Save as PDF',
    'done.saveButton': 'Save Results',
    'done.saveAsImage': 'Save as Image',
    'done.disclaimer':
      "※This is a simplified check based on relative values. Treat it as a guide to left/right balance and frequency response on your device. It's a simplified indicator, different from a clinical hearing test.",
    'print.title': 'Hearing Check Results',
    'print.subtitle': 'Simplified self-check (relative values)',
    'print.disclaimer':
      "※This is a simplified check based on relative values. Treat it as a guide to left/right balance and frequency response on your device. It's a simplified indicator, different from a clinical hearing test.",
  },
  zh: {
    'gate.passwordError': '密码错误',
    'nav.back': '返回',
    'nav.stop': '紧急停止',
    'nav.heading': '听力检查',
    'nav.resultTitle': '测定结果',
    'nav.partialWarning': '※因中途停止，部分频率未测定',
    'intro.title': '简易听力检查',
    'intro.bullet1': '・请佩戴耳机或入耳式耳机',
    'intro.bullet2': '・将按右耳→左耳的顺序，从低音到高音自动测定',
    'intro.bullet3': '・听到声音后，请按下「{{btn}}」按钮',
    'intro.bullet4': '・如果没有听到，无需任何操作（会自动进入下一步）',
    'intro.bullet5': '・所需时间约为3～5分钟',
    'intro.bullet6': '・如感到身体不适，随时可按「{{stopBtn}}」中断',
    'intro.disclaimer': '※这是依赖于所用设备音量设置的相对简易检查，不能替代医疗机构的听力检查',
    'intro.startButton': '开始',
    'intro.spaceKeyHint': '（空格键）',
    'setup.title': '请选择测定环境',
    'setup.deviceLabel': '播放设备',
    'setup.listeningLabel': '音质特性',
    'setup.deviceHeadphone': '头戴式耳机',
    'setup.deviceEarphone': '入耳式耳机',
    'setup.listeningReference': '参考品质\n（平坦特性）',
    'setup.listeningType': '聆听类型\n（低音、高音丰富的特性）',
    'setup.confirmButton': 'OK（将播放声音）',
    'calibrate.title': '请调整音量',
    'calibrate.body':
      '1kHz的基准音正在持续播放。<br/>请将耳机音量调整到不勉强、能清晰听到的<br/>"刚刚好"的大小。<br/>调整后请勿再更改设备音量，直至测定结束。',
    'calibrate.confirmButton': '以此音量开始测定',
    'measure.status': '{{ear}} 测定中 / {{freq}}',
    'measure.heardButton': '听到后按下',
    'measure.hint': '如果没有听到，无需任何操作',
    'ear.right': '右耳',
    'ear.left': '左耳',
    'done.date': '测定日',
    'done.namePlaceholder': '选填',
    'done.nameEmpty': '（未填写）',
    'done.pdfButton': '保存为PDF',
    'done.saveButton': '保存结果',
    'done.saveAsImage': '保存为图片',
    'done.disclaimer':
      '※这是基于相对值的简易检查。请将其作为在所用设备上左右差异、频段平衡的参考。这是一项简易指标，与医疗机构的听力检查不同',
    'print.title': '听力检查 测定结果',
    'print.subtitle': '简易自我检查（相对值）',
    'print.disclaimer':
      '※这是基于相对值的简易检查。请将其作为在所用设备上左右差异、频段平衡的参考。这是一项简易指标，与医疗机构的听力检查不同',
  },
  de: {
    'gate.passwordError': 'Falsches Passwort',
    'nav.back': 'Zurück',
    'nav.stop': 'Not-Stopp',
    'nav.heading': 'Hörtest',
    'nav.resultTitle': 'Messergebnis',
    'nav.partialWarning': '※Vorzeitig beendet – einige Frequenzen wurden nicht gemessen.',
    'intro.title': 'Kurzer Hörtest',
    'intro.bullet1': '・Setzen Sie Ihren Kopfhörer oder In-Ear-Kopfhörer auf.',
    'intro.bullet2': '・Die Messung läuft automatisch: rechtes Ohr, dann linkes Ohr, von tiefen zu hohen Frequenzen.',
    'intro.bullet3': '・Sobald Sie den Ton hören, drücken Sie die Taste „{{btn}}".',
    'intro.bullet4': '・Falls Sie nichts hören, müssen Sie nichts tun – es geht automatisch weiter.',
    'intro.bullet5': '・Dauert etwa 3–5 Minuten.',
    'intro.bullet6': '・Falls Sie sich unwohl fühlen, können Sie jederzeit mit „{{stopBtn}}" abbrechen.',
    'intro.disclaimer':
      'Dies ist ein relativer, vereinfachter Test, der von der Lautstärkeeinstellung Ihres Geräts abhängt. Er ersetzt keine klinische Hörprüfung.',
    'intro.startButton': 'Start',
    'intro.spaceKeyHint': '(Leertaste)',
    'setup.title': 'Wählen Sie Ihre Hörumgebung',
    'setup.deviceLabel': 'Wiedergabegerät',
    'setup.listeningLabel': 'Klangcharakter',
    'setup.deviceHeadphone': 'Kopfhörer',
    'setup.deviceEarphone': 'In-Ear-Kopfhörer',
    'setup.listeningReference': 'Referenzqualität\n(lineare Wiedergabe)',
    'setup.listeningType': 'Konsumenten-Typ\n(betonte Bässe & Höhen)',
    'setup.confirmButton': 'OK (Ton wird abgespielt)',
    'calibrate.title': 'Lautstärke einstellen',
    'calibrate.body':
      'Ein 1-kHz-Referenzton wird ununterbrochen abgespielt.<br/>Stellen Sie die Lautstärke Ihres Kopfhörers auf einen Pegel ein,<br/>den Sie mühelos und klar hören können – „genau richtig".<br/>Ändern Sie die Gerätelautstärke danach bis zum Testende nicht mehr.',
    'calibrate.confirmButton': 'Test mit dieser Lautstärke starten',
    'measure.status': 'Test: {{ear}} / {{freq}}',
    'measure.heardButton': 'Drücken, wenn gehört',
    'measure.hint': 'Wenn Sie nichts hören, müssen Sie nichts tun.',
    'ear.right': 'Rechtes Ohr',
    'ear.left': 'Linkes Ohr',
    'done.date': 'Datum',
    'done.namePlaceholder': 'optional',
    'done.nameEmpty': '(nicht angegeben)',
    'done.pdfButton': 'Als PDF speichern',
    'done.saveButton': 'Ergebnis speichern',
    'done.saveAsImage': 'Als Bild speichern',
    'done.disclaimer':
      'Dies ist ein vereinfachter Test auf Basis relativer Werte. Betrachten Sie ihn als Anhaltspunkt für die Links-Rechts-Balance und den Frequenzgang auf Ihrem Gerät. Es handelt sich um einen vereinfachten Indikator, der sich von einem klinischen Hörtest unterscheidet.',
    'print.title': 'Hörtest-Ergebnis',
    'print.subtitle': 'Vereinfachter Selbsttest (relative Werte)',
    'print.disclaimer':
      'Dies ist ein vereinfachter Test auf Basis relativer Werte. Betrachten Sie ihn als Anhaltspunkt für die Links-Rechts-Balance und den Frequenzgang auf Ihrem Gerät. Es handelt sich um einen vereinfachten Indikator, der sich von einem klinischen Hörtest unterscheidet.',
  },
  ko: {
    'gate.passwordError': '비밀번호가 틀렸습니다',
    'nav.back': '뒤로',
    'nav.stop': '긴급 정지',
    'nav.heading': '청력 체크',
    'nav.resultTitle': '측정 결과',
    'nav.partialWarning': '※도중에 중단되어 일부 주파수는 측정되지 않았습니다',
    'intro.title': '간이 청력 체크',
    'intro.bullet1': '・헤드폰 또는 이어폰을 착용해 주세요',
    'intro.bullet2': '・오른쪽 귀→왼쪽 귀 순서로 낮은 음부터 높은 음까지 자동으로 측정합니다',
    'intro.bullet3': '・소리가 들리면 「{{btn}}」 버튼을 눌러 주세요',
    'intro.bullet4': '・들리지 않으면 아무것도 하지 않아도 됩니다（자동으로 다음으로 넘어갑니다）',
    'intro.bullet5': '・소요 시간은 약 3~5분입니다',
    'intro.bullet6': '・몸에 이상을 느끼면 언제든지 「{{stopBtn}}」으로 중단할 수 있습니다',
    'intro.disclaimer': '※사용 기기의 음량 설정에 따라 달라지는 상대적인 간이 체크입니다. 의료 기관의 청력 검사를 대신할 수 없습니다',
    'intro.startButton': '시작하기',
    'intro.spaceKeyHint': '(스페이스 키)',
    'setup.title': '측정 환경을 선택해 주세요',
    'setup.deviceLabel': '재생 기기',
    'setup.listeningLabel': '음질 특성',
    'setup.deviceHeadphone': '헤드폰',
    'setup.deviceEarphone': '이어폰',
    'setup.listeningReference': '레퍼런스 품질\n（평탄한 특성）',
    'setup.listeningType': '리스닝 타입\n（저음, 고음이 풍부한 특성）',
    'setup.confirmButton': 'OK（소리가 재생됩니다）',
    'calibrate.title': '음량을 조절해 주세요',
    'calibrate.body':
      '1kHz 기준음이 계속 재생되고 있습니다.<br/>헤드폰/이어폰의 음량을 무리 없이 또렷하게 들리는<br/>"딱 적당한" 크기로 조절해 주세요.<br/>조절 후에는 측정이 끝날 때까지 기기 음량을 변경하지 마세요.',
    'calibrate.confirmButton': '이 음량으로 측정 시작',
    'measure.status': '{{ear}} 측정 중 / {{freq}}',
    'measure.heardButton': '들리면 누르기',
    'measure.hint': '들리지 않으면 아무것도 하지 않아도 됩니다',
    'ear.right': '오른쪽 귀',
    'ear.left': '왼쪽 귀',
    'done.date': '측정일',
    'done.namePlaceholder': '선택',
    'done.nameEmpty': '(미기입)',
    'done.pdfButton': 'PDF로 저장',
    'done.saveButton': '결과 저장',
    'done.saveAsImage': '이미지로 저장',
    'done.disclaimer':
      '※상대값에 의한 간이 체크입니다. 사용 기기에서의 좌우 차이·대역 밸런스의 기준으로 참고해 주세요. 의료 기관의 청력 검사와는 다른 간이 지표입니다',
    'print.title': '청력 체크 측정 결과',
    'print.subtitle': '간이 셀프 체크（상대값）',
    'print.disclaimer':
      '※상대값에 의한 간이 체크입니다. 사용 기기에서의 좌우 차이·대역 밸런스의 기준으로 참고해 주세요. 의료 기관의 청력 검사와는 다른 간이 지표입니다',
  },
  es: {
    'gate.passwordError': 'Contraseña incorrecta',
    'nav.back': 'Atrás',
    'nav.stop': 'Parada de emergencia',
    'nav.heading': 'Control auditivo',
    'nav.resultTitle': 'Resultado',
    'nav.partialWarning': '※Detenido antes de tiempo: algunas frecuencias no se midieron.',
    'intro.title': 'Control auditivo rápido',
    'intro.bullet1': '・Colóquese los auriculares o auriculares internos.',
    'intro.bullet2': '・La medición es automática: oído derecho y luego izquierdo, de graves a agudos.',
    'intro.bullet3': '・Cuando oiga el tono, pulse el botón "{{btn}}".',
    'intro.bullet4': '・Si no lo oye, no hace falta hacer nada; continuará automáticamente.',
    'intro.bullet5': '・Dura entre 3 y 5 minutos aproximadamente.',
    'intro.bullet6': '・Si se siente mal, puede detenerlo en cualquier momento con "{{stopBtn}}".',
    'intro.disclaimer':
      "※Esta es una comprobación relativa y simplificada que depende del volumen de su dispositivo. No sustituye una prueba auditiva clínica.",
    'intro.startButton': 'Empezar',
    'intro.spaceKeyHint': '(tecla espacio)',
    'setup.title': 'Seleccione su entorno de escucha',
    'setup.deviceLabel': 'Dispositivo de reproducción',
    'setup.listeningLabel': 'Carácter del sonido',
    'setup.deviceHeadphone': 'Auriculares',
    'setup.deviceEarphone': 'Auriculares internos',
    'setup.listeningReference': 'Calidad de referencia\n(respuesta plana)',
    'setup.listeningType': 'Tipo de escucha\n(graves y agudos realzados)',
    'setup.confirmButton': 'OK (se reproducirá sonido)',
    'calibrate.title': 'Ajuste el volumen',
    'calibrate.body':
      'Se está reproduciendo un tono de referencia de 1 kHz de forma continua.<br/>Ajuste el volumen de sus auriculares a un nivel que se oiga<br/>con claridad y sin esfuerzo — el nivel "justo".<br/>Después de ajustarlo, no cambie el volumen del dispositivo hasta que termine la prueba.',
    'calibrate.confirmButton': 'Iniciar la prueba con este volumen',
    'measure.status': 'Probando: {{ear}} / {{freq}}',
    'measure.heardButton': 'Pulsar al oírlo',
    'measure.hint': 'Si no lo oye, no es necesario hacer nada.',
    'ear.right': 'Oído derecho',
    'ear.left': 'Oído izquierdo',
    'done.date': 'Fecha',
    'done.namePlaceholder': 'opcional',
    'done.nameEmpty': '(sin indicar)',
    'done.pdfButton': 'Guardar como PDF',
    'done.saveButton': 'Guardar resultado',
    'done.saveAsImage': 'Guardar como imagen',
    'done.disclaimer':
      'Esta es una comprobación simplificada basada en valores relativos. Considérela una guía del equilibrio izquierda/derecha y la respuesta en frecuencia de su dispositivo. Es un indicador simplificado, distinto de una prueba auditiva clínica.',
    'print.title': 'Resultado del control auditivo',
    'print.subtitle': 'Autocomprobación simplificada (valores relativos)',
    'print.disclaimer':
      'Esta es una comprobación simplificada basada en valores relativos. Considérela una guía del equilibrio izquierda/derecha y la respuesta en frecuencia de su dispositivo. Es un indicador simplificado, distinto de una prueba auditiva clínica.',
  },
  fr: {
    'gate.passwordError': 'Mot de passe incorrect',
    'nav.back': 'Retour',
    'nav.stop': "Arrêt d'urgence",
    'nav.heading': 'Test auditif',
    'nav.resultTitle': 'Résultat',
    'nav.partialWarning': "※Arrêté avant la fin — certaines fréquences n'ont pas été mesurées.",
    'intro.title': 'Test auditif rapide',
    'intro.bullet1': '・Mettez votre casque ou vos écouteurs.',
    'intro.bullet2':
      '・La mesure se fait automatiquement : oreille droite puis gauche, des graves vers les aigus.',
    'intro.bullet3': '・Lorsque vous entendez le son, appuyez sur le bouton « {{btn}} ».',
    'intro.bullet4': "・Si vous ne l'entendez pas, il n'y a rien à faire — cela passe automatiquement à la suite.",
    'intro.bullet5': '・Dure environ 3 à 5 minutes.',
    'intro.bullet6': '・En cas de malaise, vous pouvez arrêter à tout moment avec « {{stopBtn}} ».',
    'intro.disclaimer':
      "※Il s'agit d'un test relatif et simplifié qui dépend du réglage du volume de votre appareil. Il ne remplace pas un test auditif clinique.",
    'intro.startButton': 'Commencer',
    'intro.spaceKeyHint': '(touche Espace)',
    'setup.title': "Sélectionnez votre configuration d'écoute",
    'setup.deviceLabel': 'Appareil de lecture',
    'setup.listeningLabel': 'Caractère sonore',
    'setup.deviceHeadphone': 'Casque',
    'setup.deviceEarphone': 'Écouteurs',
    'setup.listeningReference': 'Qualité de référence\n(réponse plate)',
    'setup.listeningType': 'Type grand public\n(graves et aigus accentués)',
    'setup.confirmButton': 'OK (le son va être diffusé)',
    'calibrate.title': 'Réglez le volume',
    'calibrate.body':
      'Une tonalité de référence de 1 kHz est diffusée en continu.<br/>Réglez le volume de votre casque/écouteurs à un niveau<br/>clairement audible sans effort — un niveau « juste comme il faut ».<br/>Ne modifiez plus le volume de l\'appareil jusqu\'à la fin du test.',
    'calibrate.confirmButton': 'Démarrer le test à ce volume',
    'measure.status': 'Test : {{ear}} / {{freq}}',
    'measure.heardButton': "Appuyer dès que vous l'entendez",
    'measure.hint': "Si vous ne l'entendez pas, il n'y a rien à faire.",
    'ear.right': 'Oreille droite',
    'ear.left': 'Oreille gauche',
    'done.date': 'Date',
    'done.namePlaceholder': 'facultatif',
    'done.nameEmpty': '(non renseigné)',
    'done.pdfButton': 'Enregistrer en PDF',
    'done.saveButton': 'Enregistrer le résultat',
    'done.saveAsImage': 'Enregistrer en image',
    'done.disclaimer':
      "Il s'agit d'un test simplifié basé sur des valeurs relatives. Considérez-le comme un repère pour l'équilibre gauche/droite et la réponse en fréquence sur votre appareil. C'est un indicateur simplifié, différent d'un test auditif clinique.",
    'print.title': 'Résultat du test auditif',
    'print.subtitle': 'Auto-test simplifié (valeurs relatives)',
    'print.disclaimer':
      "Il s'agit d'un test simplifié basé sur des valeurs relatives. Considérez-le comme un repère pour l'équilibre gauche/droite et la réponse en fréquence sur votre appareil. C'est un indicateur simplifié, différent d'un test auditif clinique.",
  },
  pt: {
    'gate.passwordError': 'Senha incorreta',
    'nav.back': 'Voltar',
    'nav.stop': 'Parada de emergência',
    'nav.heading': 'Teste auditivo',
    'nav.resultTitle': 'Resultado',
    'nav.partialWarning': '※Interrompido antes do fim — algumas frequências não foram medidas.',
    'intro.title': 'Teste auditivo rápido',
    'intro.bullet1': '・Coloque o fone de ouvido ou os fones intra-auriculares.',
    'intro.bullet2': '・A medição é automática: ouvido direito e depois esquerdo, do grave ao agudo.',
    'intro.bullet3': '・Quando ouvir o som, pressione o botão "{{btn}}".',
    'intro.bullet4': '・Se não ouvir, não é preciso fazer nada — ele avança automaticamente.',
    'intro.bullet5': '・Leva de 3 a 5 minutos, aproximadamente.',
    'intro.bullet6': '・Se sentir algum mal-estar, você pode interromper a qualquer momento com "{{stopBtn}}".',
    'intro.disclaimer':
      '※Esta é uma verificação relativa e simplificada que depende do volume do seu dispositivo. Não substitui um exame auditivo clínico.',
    'intro.startButton': 'Começar',
    'intro.spaceKeyHint': '(tecla Espaço)',
    'setup.title': 'Selecione seu ambiente de escuta',
    'setup.deviceLabel': 'Dispositivo de reprodução',
    'setup.listeningLabel': 'Característica sonora',
    'setup.deviceHeadphone': 'Fone de ouvido',
    'setup.deviceEarphone': 'Fone intra-auricular',
    'setup.listeningReference': 'Qualidade de referência\n(resposta plana)',
    'setup.listeningType': 'Tipo de consumo\n(graves e agudos realçados)',
    'setup.confirmButton': 'OK (o som será reproduzido)',
    'calibrate.title': 'Ajuste o volume',
    'calibrate.body':
      'Um tom de referência de 1 kHz está tocando continuamente.<br/>Ajuste o volume do fone para um nível<br/>claramente audível sem esforço — o nível "na medida certa".<br/>Depois de ajustar, não altere mais o volume do dispositivo até o fim do teste.',
    'calibrate.confirmButton': 'Iniciar o teste com este volume',
    'measure.status': 'Testando: {{ear}} / {{freq}}',
    'measure.heardButton': 'Pressionar ao ouvir',
    'measure.hint': 'Se não ouvir, não é preciso fazer nada.',
    'ear.right': 'Ouvido direito',
    'ear.left': 'Ouvido esquerdo',
    'done.date': 'Data',
    'done.namePlaceholder': 'opcional',
    'done.nameEmpty': '(não informado)',
    'done.pdfButton': 'Salvar como PDF',
    'done.saveButton': 'Salvar resultado',
    'done.saveAsImage': 'Salvar como imagem',
    'done.disclaimer':
      'Esta é uma verificação simplificada baseada em valores relativos. Use-a como referência para o equilíbrio esquerda/direita e a resposta de frequência no seu dispositivo. É um indicador simplificado, diferente de um exame auditivo clínico.',
    'print.title': 'Resultado do teste auditivo',
    'print.subtitle': 'Autoavaliação simplificada (valores relativos)',
    'print.disclaimer':
      'Esta é uma verificação simplificada baseada em valores relativos. Use-a como referência para o equilíbrio esquerda/direita e a resposta de frequência no seu dispositivo. É um indicador simplificado, diferente de um exame auditivo clínico.',
  },
};

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const raw = DICTIONARY[locale][key] ?? DICTIONARY[DEFAULT_LOCALE][key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ''));
}
