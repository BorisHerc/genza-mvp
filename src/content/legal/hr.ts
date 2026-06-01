import type { LegalDocument } from './types'

const platformNotice = {
  type: 'callout' as const,
  variant: 'info' as const,
  title: 'Genza je marketplace platforma',
  text: 'Genza nije poslodavac, agencija za zapošljavanje, izvođač radova niti pružatelj usluga. Genza je digitalna platforma koja povezuje korisnike (naručitelje) i neovisne pružatelje usluga (izvršitelje). Svi poslovi, cijene, rokovi i obveze dogovaraju se izravno između korisnika.',
}

export const hrLegalDocuments: LegalDocument[] = [
  {
    slug: 'terms',
    title: 'Uvjeti korištenja',
    subtitle: 'Pravila korištenja Genza marketplace platforme u Bosni i Hercegovini i šire.',
    lastUpdated: '26. svibnja 2026.',
    sections: [
      {
        id: 'uvod',
        title: '1. Uvod i prihvaćanje',
        blocks: [
          platformNotice,
          {
            type: 'paragraph',
            text: 'Dobrodošli na Genzu. Ovi Uvjeti korištenja („Uvjeti“) uređuju pristup i korištenje web stranice, mobilne aplikacije i povezanih usluga koje upravlja Genza („Platforma“, „mi“, „nas“). Registracijom, prijavom ili korištenjem Platforme prihvaćate ove Uvjete, Pravila privatnosti, Odricanje od odgovornosti i Zajedničke smjernice.',
          },
          {
            type: 'paragraph',
            text: 'Ako se ne slažete s Uvjetima, nemojte koristiti Platformu. Genza može povremeno ažurirati Uvjete; nastavak korištenja nakon objave smatra se prihvaćanjem izmijenjenih Uvjeta.',
          },
        ],
      },
      {
        id: 'uloga',
        title: '2. Uloga Genze — što jesmo, a što nismo',
        blocks: [
          {
            type: 'paragraph',
            text: 'Genza isključivo omogućuje objavu poslova, slanje ponuda, komunikaciju i ostavljanje recenzija između neovisnih strana. Genza ne zapošljava izvršitelje, ne dodjeljuje poslove, ne nadzire izvršenje niti prima plaćanja u ime korisnika osim ako to izričito nije navedeno u odvojenoj funkciji.',
          },
          {
            type: 'list',
            items: [
              'Genza NIJE poslodavac izvršitelja niti naručitelja.',
              'Genza NIJE agencija za privremeno zapošljavanje ili posrednik za radne odnose.',
              'Genza NIJE izvođač radova, majstor, kurir niti pružatelj usluga u smislu izvršenja poslova.',
              'Genza JEST marketplace platforma koja povezuje korisnike i neovisne pružatelje usluga.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Svaki ugovor o obavljanju posla sklapa se izravno između naručitelja i izvršitelja. Genza nije strana tog ugovora i ne jamči ispunjenje obveza bilo koje strane.',
          },
        ],
      },
      {
        id: 'racuni',
        title: '3. Računi i odgovornost korisnika',
        blocks: [
          {
            type: 'paragraph',
            text: 'Morate imati najmanje 18 godina i pružiti točne podatke pri registraciji. Odgovorni ste za sigurnost svog računa i sve aktivnosti pod vašim pristupom.',
          },
          {
            type: 'list',
            items: [
              'Odgovorni ste za sav sadržaj koji objavite (naslovi, opisi, slike, poruke, ponude).',
              'Odgovorni ste za poštivanje važećih zakona, uključujući porezne, carinske, radne i sigurnosne propise.',
              'Izvršitelji su neovisni i sami odgovorni za prijavu prihoda, PDV i druge obveze prema nadležnim tijelima.',
              'Naručitelji su odgovorni za zakonitost posla koji objavljuju i za plaćanje dogovoreno s izvršiteljem.',
            ],
          },
        ],
      },
      {
        id: 'poslovi',
        title: '4. Objavljivanje poslova i ponude',
        blocks: [
          {
            type: 'paragraph',
            text: 'Naručitelji mogu objaviti poslove u skladu s pravilima Platforme. Izvršitelji mogu slati ponude i pregovarati o cijeni, roku i opsegu rada. Genza ne jamči da će posao dobiti ponude niti da će ponuda biti prihvaćena.',
          },
          {
            type: 'paragraph',
            text: 'Genza ne provjerava kvalifikacije, licence, osiguranje niti identitet korisnika u potpunosti. Profili, recenzije i oznake služe kao indikatori povjerenja, ali ne predstavljaju garanciju kvalitete, sigurnosti ili identiteta.',
          },
        ],
      },
      {
        id: 'placanja',
        title: '5. Plaćanja i dogovori izvan platforme',
        blocks: [
          {
            type: 'paragraph',
            text: 'Način i trenutak plaćanja dogovaraju naručitelj i izvršitelj, osim ako Platforma ne nudi zaseban platni mehanizam. Genza ne odgovara za neplaćene račune, sporove o cijeni niti povrat sredstava između korisnika.',
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Dogovori izvan Genze',
            text: 'Ako nastavite komunikaciju, plaćanje ili izvršenje posla izvan Platforme, to je isključivo na vašu odgovornost. Genza ne može pružiti podršku, moderaciju niti nadzor nad takvim aranžmanima i ne snosi odgovornost za rizike koji iz toga proizlaze.',
          },
        ],
      },
      {
        id: 'odricanje',
        title: '6. Ograničenje odgovornosti',
        blocks: [
          {
            type: 'paragraph',
            text: 'U najvećoj mjeri dopuštenoj zakonom, Genza i njezini vlasnici, zaposlenici i partneri ne odgovaraju za:',
          },
          {
            type: 'list',
            items: [
              'Kvalitetu, sigurnost, zakonitost ili pravovremenost obavljenih poslova.',
              'Ponašanje, izjave ili radnje bilo kojeg korisnika na Platformi ili izvan nje.',
              'Materijalnu ili nematerijalnu štetu, ozljede, gubitak podataka ili financijski gubitak.',
              'Sporove, potraživanja ili tužbe između korisnika.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Platforma se pruža „takva kakva jest“. Genza ne daje jamstva o neprekidnom ili bezgrešnom radu usluge.',
          },
        ],
      },
      {
        id: 'moderacija',
        title: '7. Moderacija, suspenzija i uklanjanje sadržaja',
        blocks: [
          {
            type: 'paragraph',
            text: 'Genza može, prema vlastitoj procjeni i bez prethodne obavijesti:',
          },
          {
            type: 'list',
            items: [
              'Suspendirati ili trajno ukloniti korisničke račune.',
              'Sakriti, urediti ili ukloniti poslove, ponude, poruke i recenzije.',
              'Ograničiti pristup određenim funkcijama radi sigurnosti ili usklađenosti.',
              'Suradnju s nadležnim tijelima kada to zakon zahtijeva.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Povreda Uvjeta, Zajedničkih smjernica ili važećih zakona može rezultirati trenutnom suspenzijom. Odluke o moderaciji ne stvaraju obvezu Genze da pruži obrazloženje u svakom slučaju.',
          },
        ],
      },
      {
        id: 'intelektualno',
        title: '8. Intelektualno vlasništvo',
        blocks: [
          {
            type: 'paragraph',
            text: 'Genza, njezin logo, dizajn i softver zaštićeni su autorskim pravima i drugim pravima. Korisnici zadržavaju prava na sadržaj koji objave, ali daju Genzi neekskluzivnu licencu za prikaz i distribuciju tog sadržaja u svrhu rada Platforme.',
          },
        ],
      },
      {
        id: 'raskid',
        title: '9. Raskid i mjerodavno pravo',
        blocks: [
          {
            type: 'paragraph',
            text: 'Možete zatvoriti račun u postavkama profila ili kontaktiranjem podrške. Genza može raskinuti pristup ako prekršite Uvjete. Za pitanja o primjeni Uvjeta mjerodavno je pravo Bosne i Hercegovine, osim ako obvezujući propisi ne nalažu drugačije.',
          },
          {
            type: 'paragraph',
            text: 'Za prijave zloupotrebe, sigurnosna pitanja ili pravne upite kontaktirajte: trust@genza.ba',
          },
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Pravila privatnosti',
    subtitle: 'Kako Genza prikuplja, koristi i štiti vaše osobne podatke u skladu s EU/EEA standardima.',
    lastUpdated: '26. svibnja 2026.',
    sections: [
      {
        id: 'voditelj',
        title: '1. Voditelj obrade',
        blocks: [
          {
            type: 'paragraph',
            text: 'Voditelj obrade vaših osobnih podataka je Genza (marketplace platforma sa sjedištem u Bosni i Hercegovini). Za pitanja o privatnosti pišite na: privacy@genza.ba',
          },
          platformNotice,
        ],
      },
      {
        id: 'podaci',
        title: '2. Koje podatke prikupljamo',
        blocks: [
          {
            type: 'list',
            items: [
              'Podaci računa: ime, e-mail, telefon (opcionalno), grad, korisničko ime, fotografija, biografija, vještine.',
              'Podaci o korištenju: objavljeni poslovi, ponude, poruke, recenzije, prijave i tehnički zapisi.',
              'Tehnički podaci: IP adresa, vrsta uređaja, preglednik, kolačići i slični identifikatori.',
              'Podaci o plaćanju: samo ako koristite platne funkcije Platforme (obrađuje ovlašteni pružatelj plaćanja).',
            ],
          },
        ],
      },
      {
        id: 'svrha',
        title: '3. Svrha i pravna osnova obrade',
        blocks: [
          {
            type: 'paragraph',
            text: 'Podatke obrađujemo kako bismo:',
          },
          {
            type: 'list',
            items: [
              'Omogućili registraciju, autentifikaciju i rad marketplace funkcija (izvršenje ugovora).',
              'Povezali naručitelje i izvršitelje te prikazali profile i recenzije (legitimni interes).',
              'Održavali sigurnost, spriječili zloupotrebu i moderirali sadržaj (legitimni interes).',
              'Ispunili zakonske obveze i odgovorili na zahtjeve nadležnih tijela (zakonska obveza).',
              'Slali obavijesti o ponudama, porukama i ažuriranjima (privola ili legitiman interes).',
            ],
          },
        ],
      },
      {
        id: 'dijeljenje',
        title: '4. Dijeljenje podataka',
        blocks: [
          {
            type: 'paragraph',
            text: 'Genza ne prodaje vaše osobne podatke. Podatke možemo dijeliti s:',
          },
          {
            type: 'list',
            items: [
              'Drugim korisnicima — u mjeri potrebnoj za marketplace (npr. ime i profil uz ponudu).',
              'Pružateljima infrastrukture (hosting, baza podataka, analitika) uz ugovore o obradi.',
              'Nadležnim tijelima kada to zakon zahtijeva.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Genza nije odgovorna za način na koji korisnici međusobno dijele podatke izvan Platforme.',
          },
        ],
      },
      {
        id: 'cuvanje',
        title: '5. Pohrana i sigurnost',
        blocks: [
          {
            type: 'paragraph',
            text: 'Podatke čuvamo dok je račun aktivan i razumno vrijeme nakon zatvaranja radi zakonskih obveza i rješavanja sporova. Primjenjujemo tehničke i organizacijske mjere zaštite, uključujući enkripciju prijenosa i kontrolu pristupa.',
          },
        ],
      },
      {
        id: 'prava',
        title: '6. Vaša prava',
        blocks: [
          {
            type: 'paragraph',
            text: 'U skladu s primjenjivim propisima o zaštiti podataka (uključujući GDPR gdje je primjenjivo), imate pravo na:',
          },
          {
            type: 'list',
            items: [
              'Pristup, ispravak i brisanje osobnih podataka.',
              'Ograničenje obrade i prigovor na obradu.',
              'Prenosivost podataka u strukturiranom formatu.',
              'Povlačenje privole gdje se obrada temelji na privoli.',
              'Podnošenje pritužbe nadležnom tijelu za zaštitu podataka.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Zahtjeve pošaljite na privacy@genza.ba. Odgovorit ćemo u razumnom roku.',
          },
        ],
      },
      {
        id: 'medunarodno',
        title: '7. Međunarodni prijenos',
        blocks: [
          {
            type: 'paragraph',
            text: 'Podaci mogu biti pohranjeni ili obrađivani u EU/EEA ili drugim jurisdikcijama putem provjerenih pružatelja usluga uz odgovarajuće zaštitne mjere.',
          },
        ],
      },
    ],
  },
  {
    slug: 'disclaimer',
    title: 'Odricanje od odgovornosti',
    subtitle: 'Važne napomene o ograničenjima odgovornosti Genze kao marketplace platforme.',
    lastUpdated: '26. svibnja 2026.',
    sections: [
      {
        id: 'platforma',
        title: '1. Status platforme',
        blocks: [
          platformNotice,
          {
            type: 'paragraph',
            text: 'Informacije na Genzi služe isključivo u informativne svrhe. Genza ne daje profesionalne, pravne, porezne niti sigurnosne savjete. Za specifična pitanja obratite se licenciranom stručnjaku.',
          },
        ],
      },
      {
        id: 'bez-garancije',
        title: '2. Bez garancije kvalitete ili identiteta',
        blocks: [
          {
            type: 'paragraph',
            text: 'Genza ne jamči:',
          },
          {
            type: 'list',
            items: [
              'Točnost, potpunost ili ažurnost oglasa poslova i korisničkih profila.',
              'Identitet, pozadinu, licence ili osiguranje izvršitelja ili naručitelja.',
              'Kvalitetu, sigurnost, zakonitost ili rezultat bilo kojeg obavljenog posla.',
              'Istinitost recenzija ili ocjena — iako moderiramo prijave zloupotrebe.',
            ],
          },
        ],
      },
      {
        id: 'odgovornost',
        title: '3. Isključenje odgovornosti za štete',
        blocks: [
          {
            type: 'callout',
            variant: 'warning',
            title: 'Ograničenje odgovornosti',
            text: 'Genza ne odgovara za izravne, neizravne, slučajne, posebne niti posljedične štete, uključujući gubitak profita, podataka, imovine, ozljede ili smrt, proizašle iz korištenja Platforme ili odnosa između korisnika — u najvećoj mjeri dopuštenoj zakonom.',
          },
          {
            type: 'paragraph',
            text: 'Korisnici preuzimaju punu odgovornost za procjenu rizika, provjeru druge strane i sklapanje dogovora. Preporučujemo pisanu potvrdu opsega rada, cijene i roka pri većim poslovima.',
          },
        ],
      },
      {
        id: 'van-platforme',
        title: '4. Aktivnosti izvan platforme',
        blocks: [
          {
            type: 'paragraph',
            text: 'Plaćanja, sastanci, rad na lokaciji naručitelja i svi aranžmani izvan Genze odvijaju se na isključivu odgovornost sudionika. Genza ne sudjeluje u tim odnosima niti ih može nadzirati.',
          },
        ],
      },
      {
        id: 'poveznice',
        title: '5. Vanjske poveznice',
        blocks: [
          {
            type: 'paragraph',
            text: 'Platforma može sadržavati poveznice na web stranice trećih strana. Genza ne kontrolira niti odgovara za sadržaj, politiku privatnosti niti prakse tih stranica.',
          },
        ],
      },
    ],
  },
  {
    slug: 'community',
    title: 'Zajedničke smjernice',
    subtitle: 'Pravila ponašanja za poštovanje, sigurnost i povjerenje na Genzi.',
    lastUpdated: '26. svibnja 2026.',
    sections: [
      {
        id: 'vizija',
        title: '1. Naša zajednica',
        blocks: [
          {
            type: 'paragraph',
            text: 'Genza je lokalna marketplace zajednica u kojoj naručitelji i izvršitelji surađuju s poštovanjem. Ove smjernice dopunjuju Uvjete korištenja i primjenjuju se na sve korisnike.',
          },
        ],
      },
      {
        id: 'dozvoljeno',
        title: '2. Očekivano ponašanje',
        blocks: [
          {
            type: 'list',
            items: [
              'Komunicirajte jasno, pristojno i na vrijeme.',
              'Objavljujte točne opise poslova, realne budžete i lokacije.',
              'Poštujte dogovorene rokove ili unaprijed obavijestite o promjenama.',
              'Ostavljajte iskrene recenzije temeljene na stvarnom iskustvu.',
              'Prijavite sumnjivo ponašanje putem alata za prijavu ili e-maila trust@genza.ba.',
            ],
          },
        ],
      },
      {
        id: 'zabranjeno',
        title: '3. Zabranjeno ponašanje',
        blocks: [
          {
            type: 'list',
            items: [
              'Uznemiravanje, prijetnje, diskriminacija ili govor mržnje.',
              'Prijevara, lažni profili, lažne recenzije ili manipulacija ocjenama.',
              'Objava ilegalnih poslova ili sadržaja koji krši autorska prava.',
              'Spam, neželjene ponude i obilazak Platforme radi izbjegavanja naknada ili moderacije.',
              'Dijeljenje osjetljivih podataka (lozinke, puni brojevi kartica) u chatu.',
              'Zahtjevi za plaćanje unaprijed bez jasnog dogovora i povjerenja.',
            ],
          },
        ],
      },
      {
        id: 'posljedice',
        title: '4. Posljedice kršenja',
        blocks: [
          {
            type: 'paragraph',
            text: 'Genza može ukloniti sadržaj, ograničiti funkcije, suspendirati ili trajno zatvoriti račun bez naknade. U težim slučajevima suradnja s nadležnim tijelima može biti nužna.',
          },
        ],
      },
      {
        id: 'recenzije',
        title: '5. Recenzije i povratne informacije',
        blocks: [
          {
            type: 'paragraph',
            text: 'Recenzije moraju biti fer, relevantne i bez uvreda. Genza može ukloniti recenzije koje krše smjernice ili sadrže osobne napade.',
          },
        ],
      },
    ],
  },
  {
    slug: 'safety',
    title: 'Sigurnosni savjeti',
    subtitle: 'Praktične preporuke za sigurno korištenje Genze i susret s drugim korisnicima.',
    lastUpdated: '26. svibnja 2026.',
    sections: [
      {
        id: 'opce',
        title: '1. Opće sigurnosne preporuke',
        blocks: [
          platformNotice,
          {
            type: 'paragraph',
            text: 'Genza ne provodi provjere identiteta u potpunosti. Uvijek koristite zdrav razum i primjenjujte iste mjere opreza kao pri bilo kojoj usluzi s ne poznatim osobama.',
          },
        ],
      },
      {
        id: 'naručitelji',
        title: '2. Savjeti za naručitelje',
        blocks: [
          {
            type: 'list',
            items: [
              'Pregledajte profil, recenzije i povijest izvršitelja prije prihvaćanja ponude.',
              'Opišite posao što detaljnije — opseg, pristup, oprema i očekivani rezultat.',
              'Za poslove u stanu razmislite o prisutnosti drugog odraslog ili susretu u javnom prostoru prvi put.',
              'Ne dijelite lozinke, PIN-ove bankovnih kartica niti puni podatke o računu.',
              'Dogovorite cijenu i rok u chatu na Genzi prije početka rada.',
            ],
          },
        ],
      },
      {
        id: 'izvrsitelji',
        title: '3. Savjeti za izvršitelje',
        blocks: [
          {
            type: 'list',
            items: [
              'Provjerite je li posao jasan i siguran prije slanja ponude.',
              'Koristite zaštitnu opremu i poštujte sigurnosne standarde svoje struke.',
              'Obavijestite bližnje gdje idete i kada očekujete povratak kod poslova na nepoznatoj lokaciji.',
              'Ne pristajte na gotovinske predujmove bez pisanog dogovora.',
              'Odbijte poslove koji djeluju ilegalno, opasno ili neetično.',
            ],
          },
        ],
      },
      {
        id: 'susreti',
        title: '4. Susreti i plaćanja',
        blocks: [
          {
            type: 'list',
            items: [
              'Preferirajte javna mjesta za prvi susret kad je moguće.',
              'Koristite provjerene načine plaćanja i zadržite potvrdu uplate.',
              'Ne šaljite novac nepoznatim osobama izvan dogovorenog posla.',
              'Ako nešto djeluje sumnjivo, prekinite kontakt i prijavite na trust@genza.ba.',
            ],
          },
        ],
      },
      {
        id: 'hitno',
        title: '5. Hitne situacije',
        blocks: [
          {
            type: 'callout',
            variant: 'warning',
            title: 'U opasnosti zovi hitnu pomoć',
            text: 'Genza nije hitna služba. U slučaju neposredne opasnosti, ozljede ili kriminala odmah kontaktirajte lokalnu policiju ili hitnu medicinsku pomoć (112). Nakon toga nas obavijestite na trust@genza.ba kako bismo poduzeli korake na Platformi.',
          },
        ],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Politika kolačića',
    subtitle: 'Informacije o kolačićima i sličnim tehnologijama na Genzi.',
    lastUpdated: '26. svibnja 2026.',
    sections: [
      {
        id: 'sto-su',
        title: '1. Što su kolačići',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kolačići su male tekstualne datoteke koje se pohranjuju na vaš uređaj kada posjetite web stranicu. Pomažu nam osigurati prijavu, pamćenje postavki i razumijevanje korištenja Platforme.',
          },
        ],
      },
      {
        id: 'vrste',
        title: '2. Vrste kolačića koje koristimo',
        blocks: [
          {
            type: 'list',
            items: [
              'Nužni kolačići — potrebni za prijavu, sigurnost sesije i osnovne funkcije. Ne mogu se isključiti.',
              'Funkcionalni kolačići — pamte jezik, lokaciju ili preferencije (npr. genza_locale).',
              'Analitički kolačići — pomažu nam razumjeti korištenje u agregiranom obliku radi poboljšanja usluge.',
            ],
          },
        ],
      },
      {
        id: 'upravljanje',
        title: '3. Upravljanje kolačićima',
        blocks: [
          {
            type: 'paragraph',
            text: 'Možete odbiti ne nužne kolačiće putem postavki preglednika ili alata za upravljanje privolama kada budu dostupni. Blokiranje nužnih kolačića može onemogućiti prijavu ili korištenje određenih funkcija.',
          },
          {
            type: 'paragraph',
            text: 'Detalje o osobnim podacima obrađenim putem kolačića potražite u Pravilima privatnosti.',
          },
        ],
      },
      {
        id: 'trajanje',
        title: '4. Trajanje',
        blocks: [
          {
            type: 'paragraph',
            text: 'Sesijski kolačići brišu se nakon zatvaranja preglednika. Trajni kolačići ostaju do isteka roka ili dok ih ručno ne uklonite.',
          },
        ],
      },
      {
        id: 'kontakt',
        title: '5. Kontakt',
        blocks: [
          {
            type: 'paragraph',
            text: 'Pitanja o kolačićima: privacy@genza.ba',
          },
        ],
      },
    ],
  },
]
