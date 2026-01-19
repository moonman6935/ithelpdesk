export const translations = {
  tr: {
    header: {
      title: 'DCS IT Destek',
      home: 'Ana Sayfa',
      pcSetup: 'PC Kurulumu',
      headsetTest: 'Kulaklık Testi',
      troubleshooting: 'Sorun Giderme'
    },
    home: {
      welcome: 'DCS Communication Center IT Departmanı',
      subtitle: 'Bilgisayar Kurulum ve Destek Rehberi',
      description: 'Yeni bilgisayarınızı kurmak ve USB kulaklığınızı test etmek için adım adım rehberlerimizi kullanın.',
      getStarted: 'Kuruluma Başla',
      testHeadset: 'Kulaklık Testi',
      features: {
        title: 'Hizmetlerimiz',
        setup: 'PC Kurulumu',
        setupDesc: 'Detaylı görsellerle bilgisayar kurulum rehberi',
        test: 'Kulaklık Testi',
        testDesc: 'USB kulaklık ses ve mikrofon testi',
        support: 'Sorun Giderme',
        supportDesc: 'Yaygın sorunlar için çözümler'
      }
    },
    pcSetup: {
      title: 'Bilgisayar Kurulum Kılavuzu',
      subtitle: 'Size iletilen ekipmanların tanımları ve bilgisayar kurulumu',
      interactive: 'İnteraktif Rehber',
      scrollView: 'Tüm Adımlar',
      important: 'Dikkat Edilmesi Gerekenler',
      equipmentDef: 'Ekipman Tanımları',
      step0: {
        title: 'Dikkat Edilmesi Gerekenler',
        item1: 'Ekran bağlamak için kullanılan HDMI ve VGA kablolarının her zaman bir ucu monitöre* diğer ucu bilgisayar kasasına takılacaktır.',
        item2: 'Eğer kablo girişlere uymuyorsa lütfen girişi ve kabloyu zorlamayın.',
        item3: 'Bilgisayar ve ekipmanlarını sıvı maddelerden uzak tutun.',
        item4: 'Ekipmanlar size teslim edilirken kullanılan kutuları saklayın, ekipmanların birini veya bir kaçını bize tekrar göndereceğiniz zaman lütfen size teslim edildiği şekilde kutulayın ve kargolayın.',
        item5: 'Ekipmanların temizliğine dikkat edin.',
        item6: 'Bilgisayar kasasına müdahale etmeyin.',
        item7: 'Parça sökmek, vida açmak gibi işlemlerde bulunmayın.',
        item8: 'Kasadaki havalandırma deliklerini kapatmayın.',
        item9: 'Bilgisayarının kasasının üzerine yanıcı madde koymayın.',
        item10: 'İş için gerekli olmayan konularda bilgisayarı kullanmayın, indirme, yükleme gibi faaliyetlerde bulunmayın, aksi halde ekipmanın zarar görmesi durumunda mesuliyet şirkete ait değildir.'
      },
      step1: {
        title: 'Ekipman Tanımları',
        desc: 'Kurulum için gerekli ekipmanlar ve kablo tanımları',
        powerCable: 'Güç Kablosu',
        powerDesc: 'Bu Kablo Ekran Ve Kasaya birer tane olacak şekilde takılır ve diğer ucu da elektrik prizine takılır.',
        vgaCable: 'VGA Kablosu',
        vgaDesc: 'Görüntü aktarımı sağlayan bu kablo HDMI KABLOSUNUN TAKILI OLMADIĞI ekrana bir ucu ekranda diğer ucu bilgisayar kasında olacak şekilde takılacaktır.',
        hdmiCable: 'HDMI Kablo',
        hdmiDesc: 'Görüntü aktarımı sağlayan bu kablo VGA KABLOSUNUN TAKILI OLMADIĞI ekrana bir ucu ekranda diğer ucu bilgisayar kasında olacak şekilde takılacaktır.'
      },
      step2: {
        title: 'Port Tanımları',
        desc: 'Bilgisayar kasası arka panelindeki port bağlantıları',
        port1: 'Güç Kablosu girişi',
        port2: 'HDMI kablo girişi',
        port3: 'VGA Kablosu girişi',
        port4: 'DVI Kablosu girişi',
        port5: 'Ethernet * Kablosu girişi',
        port6: 'USB Kablosu girişi',
        port6desc: 'Klavye, Mouse, kulaklık, Webcam bu girişe takılacaktır.',
        note: '* İnternet Kablosu'
      },
      step3: {
        title: 'Bilgisayar Kasası Bağlantıları',
        desc: 'PC kasasının arka paneline kablo bağlantıları',
        connection1: 'Güç Kablosu buraya takılacaktır.',
        connection2: 'HDMI kablosu buraya takılacaktır.',
        connection3: 'VGA kablosu buraya takılacaktır.',
        connection4: 'Kulaklık, Fare (Mouse), Klavye, Webcam buraya takılacaktır.',
        connection5: 'Bir ucu modeme takılı olan ETHERNET kablosunun diğer ucu buraya takılacaktır.'
      },
      step4: {
        title: 'Monitör Bağlantıları',
        desc: 'VGA ve HDMI kablo bağlantıları monitöre nasıl yapılır',
        instruction1: 'VGA kablosunun bir ucunu BİRİNCİ monitörün VGA girişine takın',
        instruction2: 'VGA kablosunun diğer ucunu PC kasasının arka panelindeki VGA portuna takın',
        instruction3: 'HDMI kablosunun bir ucunu İKİNCİ monitörün HDMI girişine takın',
        instruction4: 'HDMI kablosunun diğer ucunu PC kasasının arka panelindeki HDMI portuna takın',
        tip: 'Önemli: Bir monitör VGA, diğer monitör HDMI ile bağlanmalıdır'
      },
      step5: {
        title: 'Çift Monitör Kurulumu',
        desc: 'Windows ayarları ile çift monitör kurulumu',
        instruction1: 'Her iki monitörü ve bilgisayarı açın',
        instruction2: 'Klavyenizde WINDOWS tuşu + P tuşuna basın',
        instruction3: 'Açılan menüden "Uzat" (Extend) seçeneğini seçin',
        instruction4: 'Her iki monitörde de görüntü görmelisiniz',
        tip: 'Uzat modu, masaüstünüzü iki ekrana yayar'
      },
      next: 'Sonraki Adım',
      previous: 'Önceki Adım',
      complete: 'Kurulum Tamamlandı!'
    },
    headsetTest: {
      title: 'USB Kulaklık Ses Testi',
      subtitle: 'Kulaklığınızın mikrofon ve ses çıkışını test edin',
      startTest: 'Testi Başlat',
      stopTest: 'Testi Durdur',
      testing: 'Test Ediliyor...',
      speakerTest: 'Hoparlör Testi',
      speakerDesc: 'Test sesini duyuyor musunuz?',
      playSound: 'Ses Çal',
      stopSound: 'Durdur',
      micTest: 'Mikrofon Testi',
      micDesc: 'Mikrofona konuşun, ses seviyesi gösterilecek',
      permission: 'Mikrofon İzni Gerekli',
      permissionDesc: 'Lütfen tarayıcıdan mikrofon izni verin',
      requestPermission: 'İzin İste',
      results: {
        title: 'Test Sonuçları',
        speaker: 'Hoparlör',
        microphone: 'Mikrofon',
        working: 'Çalışıyor',
        notWorking: 'Çalışmıyor',
        notTested: 'Test Edilmedi'
      },
      troubleshoot: 'Sorun mu var? Sorun Giderme bölümüne gidin'
    },
    troubleshooting: {
      title: 'Sorun Giderme',
      subtitle: 'Yaygın sorunlar ve çözümleri',
      noSound: {
        title: 'Kulaklıktan Ses Gelmiyor',
        solution1: 'USB kulaklığın ARKA panel USB portuna takılı olduğundan emin olun',
        solution2: 'Windows ses ayarlarını kontrol edin',
        solution3: 'Varsayılan ses aygıtını değiştirin'
      },
      noMic: {
        title: 'Mikrofon Çalışmıyor',
        solution1: 'Windows gizlilik ayarlarından mikrofon izni verin',
        solution2: 'Mikrofonu varsayılan kayıt aygıtı olarak ayarlayın',
        solution3: 'Mikrofon seviyesini kontrol edin'
      },
      displayIssue: {
        title: 'Monitörde Görüntü Yok',
        solution1: 'Kablo bağlantılarını kontrol edin',
        solution2: 'Monitörün doğru giriş kaynağı seçildiğinden emin olun',
        solution3: 'WINDOWS + P tuşuna basıp "Uzat" seçin'
      },
      soundSettings: {
        title: 'Windows Ses Ayarları Nasıl Değiştirilir',
        step1: 'Görev çubuğundaki ses simgesine SAĞ tıklayın',
        step2: '"Ses ayarları" seçeneğini seçin',
        step3: '"Çıkış" bölümünden USB kulaklığınızı seçin',
        step4: 'Test sesi çalın ve kontrol edin'
      }
    },
    footer: {
      rights: '© 2025 DCS Communication Center. Tüm hakları saklıdır.',
      support: 'IT Destek',
      contact: 'İletişim'
    }
  },
  de: {
    header: {
      title: 'DCS IT-Support',
      home: 'Startseite',
      pcSetup: 'PC-Einrichtung',
      headsetTest: 'Headset-Test',
      troubleshooting: 'Fehlerbehebung'
    },
    home: {
      welcome: 'DCS Communication Center IT-Abteilung',
      subtitle: 'Computer-Installations- und Support-Handbuch',
      description: 'Verwenden Sie unsere Schritt-für-Schritt-Anleitungen zum Einrichten Ihres neuen Computers und zum Testen Ihres USB-Headsets.',
      getStarted: 'Installation starten',
      testHeadset: 'Headset testen',
      features: {
        title: 'Unsere Dienstleistungen',
        setup: 'PC-Einrichtung',
        setupDesc: 'Detaillierte Anleitung zur Computerinstallation mit Bildern',
        test: 'Headset-Test',
        testDesc: 'USB-Headset Audio- und Mikrofontest',
        support: 'Fehlerbehebung',
        supportDesc: 'Lösungen für häufige Probleme'
      }
    },
    pcSetup: {
      title: 'Desktop-Computer-Einrichtung',
      subtitle: 'Befolgen Sie diese Schritte, um Ihren Computer richtig einzurichten',
      interactive: 'Interaktive Anleitung',
      scrollView: 'Alle Schritte',
      step1: {
        title: 'Schritt 1: Komponenten identifizieren',
        desc: 'Ihr Paket enthält:',
        item1: '1x PC-Gehäuse (mit HDMI- und VGA-Ausgang)',
        item2: '2x Monitore (mit HDMI- und VGA-Eingang)',
        item3: '1x Tastatur',
        item4: '1x Maus',
        item5: '1x USB-Headset (Nur USB-Headset verwenden)',
        warning: 'WICHTIG: Verwenden Sie KEINE Klinken- oder Bluetooth-Headsets!'
      },
      step2: {
        title: 'Schritt 2: Ersten Monitor anschließen (VGA)',
        desc: 'Verbinden Sie den ersten Monitor mit dem VGA-Kabel mit dem Gehäuse',
        instruction1: 'Stecken Sie ein Ende des VGA-Kabels in den VGA-Anschluss auf der RÜCKSEITE des PC-Gehäuses',
        instruction2: 'Stecken Sie das andere Ende des VGA-Kabels in den VGA-Eingang des MONITORS',
        instruction3: 'Ziehen Sie die Schraubverbindungen fest',
        tip: 'Tipp: Der VGA-Anschluss ist ein blauer 15-poliger D-Sub-Stecker'
      },
      step3: {
        title: 'Schritt 3: Zweiten Monitor anschließen (HDMI)',
        desc: 'Verbinden Sie den zweiten Monitor mit dem HDMI-Kabel mit dem Gehäuse',
        instruction1: 'Stecken Sie ein Ende des HDMI-Kabels in den HDMI-Anschluss auf der RÜCKSEITE des PC-Gehäuses',
        instruction2: 'Stecken Sie das andere Ende des HDMI-Kabels in den HDMI-Eingang des ZWEITEN MONITORS',
        tip: 'Tipp: Der HDMI-Anschluss ist ein rechteckiger 19-poliger Stecker'
      },
      step4: {
        title: 'Schritt 4: Tastatur und Maus',
        desc: 'Schließen Sie Tastatur und Maus an USB-Anschlüsse an',
        instruction1: 'Stecken Sie die Tastatur in einen beliebigen USB-Anschluss auf der RÜCKSEITE des Gehäuses',
        instruction2: 'Stecken Sie die Maus in einen anderen USB-Anschluss auf der RÜCKSEITE des Gehäuses',
        tip: 'Lassen Sie die USB-Anschlüsse an der Vorderseite für das Headset frei'
      },
      step5: {
        title: 'Schritt 5: USB-Headset',
        desc: 'Schließen Sie das USB-Headset an die Rückseite an',
        instruction1: 'Stecken Sie das USB-Headset in einen USB-Anschluss auf der RÜCKSEITE des PC-Gehäuses',
        instruction2: 'Verwenden Sie NICHT die USB-Anschlüsse an der Vorderseite',
        warning: 'Nur USB-Headsets verwenden! KEINE Klinken- oder Bluetooth-Headsets!'
      },
      step6: {
        title: 'Schritt 6: Stromversorgung',
        desc: 'Schließen Sie alle Geräte an die Steckdose an',
        instruction1: 'Stecken Sie das Stromkabel des PC-Gehäuses in die Steckdose',
        instruction2: 'Stecken Sie die Stromkabel beider Monitore in die Steckdose',
        instruction3: 'Schalten Sie den Computer und die Monitore ein'
      },
      step7: {
        title: 'Schritt 7: Display-Einstellungen',
        desc: 'Konfigurieren Sie die Anzeigeeinstellungen für Dual-Monitor',
        instruction1: 'Drücken Sie die WINDOWS-Taste + P auf Ihrer Tastatur',
        instruction2: 'Wählen Sie "Erweitern" aus dem angezeigten Menü',
        instruction3: 'Sie sollten auf beiden Monitoren ein Bild sehen',
        tip: 'Der Erweitern-Modus erstreckt Ihren Desktop über zwei Bildschirme'
      },
      next: 'Nächster Schritt',
      previous: 'Vorheriger Schritt',
      complete: 'Einrichtung abgeschlossen!'
    },
    headsetTest: {
      title: 'USB-Headset-Audiotest',
      subtitle: 'Testen Sie Mikrofon und Audioausgang Ihres Headsets',
      startTest: 'Test starten',
      stopTest: 'Test stoppen',
      testing: 'Wird getestet...',
      speakerTest: 'Lautsprecher-Test',
      speakerDesc: 'Hören Sie den Testton?',
      playSound: 'Ton abspielen',
      stopSound: 'Stoppen',
      micTest: 'Mikrofon-Test',
      micDesc: 'Sprechen Sie ins Mikrofon, der Audiopegel wird angezeigt',
      permission: 'Mikrofonberechtigung erforderlich',
      permissionDesc: 'Bitte erlauben Sie den Mikrofonzugriff im Browser',
      requestPermission: 'Berechtigung anfordern',
      results: {
        title: 'Testergebnisse',
        speaker: 'Lautsprecher',
        microphone: 'Mikrofon',
        working: 'Funktioniert',
        notWorking: 'Funktioniert nicht',
        notTested: 'Nicht getestet'
      },
      troubleshoot: 'Probleme? Gehen Sie zum Fehlerbehebungsbereich'
    },
    troubleshooting: {
      title: 'Fehlerbehebung',
      subtitle: 'Häufige Probleme und Lösungen',
      noSound: {
        title: 'Kein Ton vom Headset',
        solution1: 'Stellen Sie sicher, dass das USB-Headset an einen USB-Anschluss auf der RÜCKSEITE angeschlossen ist',
        solution2: 'Überprüfen Sie die Windows-Soundeinstellungen',
        solution3: 'Ändern Sie das Standard-Audiogerät'
      },
      noMic: {
        title: 'Mikrofon funktioniert nicht',
        solution1: 'Erteilen Sie die Mikrofonberechtigung in den Windows-Datenschutzeinstellungen',
        solution2: 'Legen Sie das Mikrofon als Standard-Aufnahmegerät fest',
        solution3: 'Überprüfen Sie den Mikrofonpegel'
      },
      displayIssue: {
        title: 'Kein Bild auf dem Monitor',
        solution1: 'Überprüfen Sie die Kabelverbindungen',
        solution2: 'Stellen Sie sicher, dass die richtige Eingangsquelle am Monitor ausgewählt ist',
        solution3: 'Drücken Sie WINDOWS + P und wählen Sie "Erweitern"'
      },
      soundSettings: {
        title: 'Windows-Soundeinstellungen ändern',
        step1: 'RECHTSKLICK auf das Lautsprechersymbol in der Taskleiste',
        step2: 'Wählen Sie "Soundeinstellungen"',
        step3: 'Wählen Sie Ihr USB-Headset im Bereich "Ausgabe"',
        step4: 'Spielen Sie einen Testton ab und überprüfen Sie'
      }
    },
    footer: {
      rights: '© 2025 DCS Communication Center. Alle Rechte vorbehalten.',
      support: 'IT-Support',
      contact: 'Kontakt'
    }
  },
  en: {
    header: {
      title: 'DCS IT Support',
      home: 'Home',
      pcSetup: 'PC Setup',
      headsetTest: 'Headset Test',
      troubleshooting: 'Troubleshooting'
    },
    home: {
      welcome: 'DCS Communication Center IT Department',
      subtitle: 'Computer Installation and Support Guide',
      description: 'Use our step-by-step guides to set up your new computer and test your USB headset.',
      getStarted: 'Get Started',
      testHeadset: 'Test Headset',
      features: {
        title: 'Our Services',
        setup: 'PC Setup',
        setupDesc: 'Detailed computer installation guide with images',
        test: 'Headset Test',
        testDesc: 'USB headset audio and microphone testing',
        support: 'Troubleshooting',
        supportDesc: 'Solutions for common issues'
      }
    },
    pcSetup: {
      title: 'Desktop Computer Setup',
      subtitle: 'Follow these steps to properly set up your computer',
      interactive: 'Interactive Guide',
      scrollView: 'All Steps',
      step1: {
        title: 'Step 1: Identify Components',
        desc: 'Your package includes:',
        item1: '1x PC Case (with HDMI and VGA output)',
        item2: '2x Monitors (with HDMI and VGA input)',
        item3: '1x Keyboard',
        item4: '1x Mouse',
        item5: '1x USB Headset (Use USB headset only)',
        warning: 'IMPORTANT: Do NOT use jack or Bluetooth headsets!'
      },
      step2: {
        title: 'Step 2: Connect First Monitor (VGA)',
        desc: 'Connect the first monitor to the case using VGA cable',
        instruction1: 'Plug one end of the VGA cable into the VGA port on the BACK PANEL of the PC case',
        instruction2: 'Plug the other end of the VGA cable into the VGA input of the MONITOR',
        instruction3: 'Tighten the screw connections',
        tip: 'Tip: VGA port is a blue 15-pin D-Sub connector'
      },
      step3: {
        title: 'Step 3: Connect Second Monitor (HDMI)',
        desc: 'Connect the second monitor to the case using HDMI cable',
        instruction1: 'Plug one end of the HDMI cable into the HDMI port on the BACK PANEL of the PC case',
        instruction2: 'Plug the other end of the HDMI cable into the HDMI input of the SECOND MONITOR',
        tip: 'Tip: HDMI port is a rectangular 19-pin connector'
      },
      step4: {
        title: 'Step 4: Keyboard and Mouse',
        desc: 'Connect keyboard and mouse to USB ports',
        instruction1: 'Plug the keyboard into any USB port on the BACK panel of the case',
        instruction2: 'Plug the mouse into another USB port on the BACK panel of the case',
        tip: 'Leave front panel USB ports free for headset'
      },
      step5: {
        title: 'Step 5: USB Headset',
        desc: 'Connect USB headset to BACK panel',
        instruction1: 'Plug the USB headset into a USB port on the BACK PANEL of the PC case',
        instruction2: 'Do NOT use front panel USB ports',
        warning: 'Use USB headset ONLY! Do NOT use jack or Bluetooth headsets!'
      },
      step6: {
        title: 'Step 6: Power Connections',
        desc: 'Connect all devices to power outlet',
        instruction1: 'Plug the PC case power cable into the outlet',
        instruction2: 'Plug both monitors\' power cables into the outlet',
        instruction3: 'Turn on the computer and monitors'
      },
      step7: {
        title: 'Step 7: Display Settings',
        desc: 'Configure display settings for dual monitor setup',
        instruction1: 'Press WINDOWS key + P on your keyboard',
        instruction2: 'Select "Extend" from the menu that appears',
        instruction3: 'You should see display on both monitors',
        tip: 'Extend mode spreads your desktop across two screens'
      },
      next: 'Next Step',
      previous: 'Previous Step',
      complete: 'Setup Complete!'
    },
    headsetTest: {
      title: 'USB Headset Audio Test',
      subtitle: 'Test your headset microphone and audio output',
      startTest: 'Start Test',
      stopTest: 'Stop Test',
      testing: 'Testing...',
      speakerTest: 'Speaker Test',
      speakerDesc: 'Can you hear the test sound?',
      playSound: 'Play Sound',
      stopSound: 'Stop',
      micTest: 'Microphone Test',
      micDesc: 'Speak into the microphone, audio level will be displayed',
      permission: 'Microphone Permission Required',
      permissionDesc: 'Please allow microphone access in the browser',
      requestPermission: 'Request Permission',
      results: {
        title: 'Test Results',
        speaker: 'Speaker',
        microphone: 'Microphone',
        working: 'Working',
        notWorking: 'Not Working',
        notTested: 'Not Tested'
      },
      troubleshoot: 'Having issues? Go to Troubleshooting section'
    },
    troubleshooting: {
      title: 'Troubleshooting',
      subtitle: 'Common problems and solutions',
      noSound: {
        title: 'No Sound from Headset',
        solution1: 'Make sure USB headset is plugged into a BACK panel USB port',
        solution2: 'Check Windows sound settings',
        solution3: 'Change default audio device'
      },
      noMic: {
        title: 'Microphone Not Working',
        solution1: 'Grant microphone permission in Windows privacy settings',
        solution2: 'Set microphone as default recording device',
        solution3: 'Check microphone level'
      },
      displayIssue: {
        title: 'No Display on Monitor',
        solution1: 'Check cable connections',
        solution2: 'Make sure correct input source is selected on monitor',
        solution3: 'Press WINDOWS + P and select "Extend"'
      },
      soundSettings: {
        title: 'How to Change Windows Sound Settings',
        step1: 'RIGHT-CLICK on the speaker icon in the taskbar',
        step2: 'Select "Sound settings"',
        step3: 'Select your USB headset from the "Output" section',
        step4: 'Play a test sound and verify'
      }
    },
    footer: {
      rights: '© 2025 DCS Communication Center. All rights reserved.',
      support: 'IT Support',
      contact: 'Contact'
    }
  }
};
