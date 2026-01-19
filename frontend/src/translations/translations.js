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
      title: 'Computer-Installationsanleitung',
      subtitle: 'Beschreibungen der Ihnen übermittelten Geräte und Computer-Installation',
      interactive: 'Interaktive Anleitung',
      scrollView: 'Alle Schritte',
      important: 'Wichtige Hinweise',
      equipmentDef: 'Gerätedefinitionen',
      step0: {
        title: 'Wichtige Hinweise',
        item1: 'HDMI- und VGA-Kabel zum Anschluss des Bildschirms haben immer ein Ende am Monitor* und das andere Ende am Computergehäuse.',
        item2: 'Wenn das Kabel nicht in die Anschlüsse passt, zwingen Sie bitte nicht den Anschluss und das Kabel.',
        item3: 'Halten Sie Computer und Geräte von Flüssigkeiten fern.',
        item4: 'Bewahren Sie die beim Versand verwendeten Kartons auf. Wenn Sie eines oder mehrere Geräte an uns zurücksenden, verpacken und versenden Sie sie bitte so wie geliefert.',
        item5: 'Achten Sie auf die Sauberkeit der Geräte.',
        item6: 'Öffnen Sie nicht das Computergehäuse.',
        item7: 'Entfernen Sie keine Teile oder schrauben Sie nichts ab.',
        item8: 'Blockieren Sie nicht die Lüftungsöffnungen am Gehäuse.',
        item9: 'Stellen Sie keine brennbaren Materialien auf das Computergehäuse.',
        item10: 'Verwenden Sie den Computer nicht für nicht arbeitsbezogene Zwecke. Bei Schäden durch Downloads oder Installationen liegt die Verantwortung nicht beim Unternehmen.'
      },
      step1: {
        title: 'Gerätedefinitionen',
        desc: 'Erforderliche Geräte und Kabeldefinitionen für die Installation',
        powerCable: 'Stromkabel',
        powerDesc: 'Dieses Kabel wird jeweils einmal an Bildschirm und Gehäuse angeschlossen, das andere Ende an die Steckdose.',
        vgaCable: 'VGA-Kabel',
        vgaDesc: 'Dieses bildübertragende Kabel wird an den Bildschirm angeschlossen, AN DEM DAS HDMI-KABEL NICHT angeschlossen ist, ein Ende am Bildschirm, das andere am Computergehäuse.',
        hdmiCable: 'HDMI-Kabel',
        hdmiDesc: 'Dieses bildübertragende Kabel wird an den Bildschirm angeschlossen, AN DEM DAS VGA-KABEL NICHT angeschlossen ist, ein Ende am Bildschirm, das andere am Computergehäuse.'
      },
      step2: {
        title: 'Port-Definitionen',
        desc: 'Portanschlüsse an der Rückseite des Computergehäuses',
        port1: 'Stromkabelanschluss',
        port2: 'HDMI-Kabelanschluss',
        port3: 'VGA-Kabelanschluss',
        port4: 'DVI-Kabelanschluss',
        port5: 'Ethernet*-Kabelanschluss',
        port6: 'USB-Kabelanschluss',
        port6desc: 'Tastatur, Maus, Headset, Webcam werden hier angeschlossen.',
        note: '* Internetkabel'
      },
      step3: {
        title: 'Computergehäuse-Anschlüsse',
        desc: 'Kabelanschlüsse an der Rückseite des PC-Gehäuses',
        connection1: 'Das Stromkabel wird hier angeschlossen.',
        connection2: 'Das HDMI-Kabel wird hier angeschlossen.',
        connection3: 'Das VGA-Kabel wird hier angeschlossen.',
        connection4: 'Headset, Maus, Tastatur, Webcam werden hier angeschlossen.',
        connection5: 'Das andere Ende des ETHERNET-Kabels, das an das Modem angeschlossen ist, wird hier angeschlossen.'
      },
      step4: {
        title: 'Monitor-Anschlüsse',
        desc: 'Wie VGA- und HDMI-Kabelanschlüsse zum Monitor hergestellt werden',
        instruction1: 'Schließen Sie ein Ende des VGA-Kabels an den VGA-Eingang des ERSTEN Monitors an',
        instruction2: 'Schließen Sie das andere Ende des VGA-Kabels an den VGA-Port an der Rückseite des PC-Gehäuses an',
        instruction3: 'Schließen Sie ein Ende des HDMI-Kabels an den HDMI-Eingang des ZWEITEN Monitors an',
        instruction4: 'Schließen Sie das andere Ende des HDMI-Kabels an den HDMI-Port an der Rückseite des PC-Gehäuses an',
        tip: 'Wichtig: Ein Monitor wird mit VGA, der andere mit HDMI verbunden'
      },
      step5: {
        title: 'Dual-Monitor-Einrichtung',
        desc: 'Dual-Monitor-Einrichtung mit Windows-Einstellungen',
        instruction1: 'Schalten Sie beide Monitore und den Computer ein',
        instruction2: 'Drücken Sie die WINDOWS-Taste + P auf Ihrer Tastatur',
        instruction3: 'Wählen Sie "Erweitern" aus dem angezeigten Menü',
        instruction4: 'Sie sollten auf beiden Monitoren ein Bild sehen',
        tip: 'Der Erweitern-Modus verteilt Ihren Desktop auf zwei Bildschirme'
      },
      next: 'Nächster Schritt',
      previous: 'Vorheriger Schritt',
      complete: 'Installation abgeschlossen!'
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
