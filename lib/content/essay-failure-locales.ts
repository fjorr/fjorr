import type { AppLocale } from '@/i18n/config';
import type { EssayBlock } from './essay-failure';

const VOYAGE_SRC =
  'https://media.fjorr.com/app-assets/fjorr-le-voyage-dans-la-lune.jpg';

function p(text: string): EssayBlock {
  return { type: 'p', text };
}
function h2(text: string): EssayBlock {
  return { type: 'h2', text };
}
function figure(alt: string, caption: string): EssayBlock {
  return {
    type: 'figure',
    src: VOYAGE_SRC,
    alt,
    width: 1000,
    height: 1330,
    caption,
  };
}
function timeline(
  items: { year: string; title: string; text: string }[]
): EssayBlock {
  return { type: 'timeline', items };
}

const it: EssayBlock[] = [
  p('Il cortometraggio non ha mai avuto un modello di business che funzionasse — solo cent’anni di modelli rotti.'),
  p('Per un secolo, il cortometraggio non è stato quasi mai qualcosa per cui si comprasse un biglietto. Era ciò che passava mentre la gente trovava posto. Un numero di apertura, un riempitivo da cinegiornale, un contenuto bonus appiccicato a un menu DVD, o un prodotto civetta per provare un nuovo software di animazione. Non era una scelta artistica; è diventata l’intera identità strutturale della categoria: qualcosa di gratis, attaccato a qualcos’altro, e mai la ragione per cui qualcuno si presentava.'),
  p('Il problema di mercato non è mai stato la mancanza di interesse umano. È stato il fallimento del veicolo di monetizzazione.'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. L’uomo nella luna con una capsula conficcata nell’occhio.',
    '*Le Voyage dans la Lune*, 1902. Diretto da Georges Méliès.'
  ),
  p('Il cortometraggio è vecchio esattamente quanto il cinema. Nel 1902 Méliès mandò un razzo nell’occhio della luna, in uno dei primi film narrativi mai realizzati. Il formato ha avuto più di un secolo per trovare un modello di business che funzionasse. Non l’ha mai trovato.'),
  h2('Le meccaniche rotte della storia del cinema'),
  p('Ogni tentativo di monetizzare il cinema breve, dalla Hollywood delle origini alla Silicon Valley, ha cercato di forzare il formato in una scatola transazionale, pubblicitaria o centrata sul lungometraggio — e ognuno si è rotto allo stesso modo.'),
  timeline([
    {
      year: '1948',
      title: 'Il crollo del sistema degli studios',
      text: 'Negli anni Trenta e Quaranta, Hollywood obbligava le sale a comprare i corti insieme ai lungometraggi tramite il «block booking». Quando nel 1948 la Corte Suprema dichiarò la pratica illegale con i Paramount Decrees, la base finanziaria dei reparti cortometraggi fu distrutta. Nel decennio successivo gli studios smantellarono sistematicamente le loro unità di corti — la MGM chiuse il reparto animazione nel 1957, e la Warner Bros. ridusse la produzione dei suoi cartoon iconici negli anni Sessanta.',
    },
    {
      year: '1953',
      title: 'La svolta Disney',
      text: 'Nel 1953 Walt Disney chiuse il reparto dedicato ai cartoon corti. I costi di produzione dell’animazione disegnata a mano erano esplosi, ma le sale pagavano solo un canone fisso, irrisorio. Disney capì che i corti perdevano soldi a ogni uscita, e fu costretto a una svolta completa verso i lungometraggi e la televisione finanziata dagli inserzionisti.',
    },
    {
      year: '1995–oggi',
      title: 'Il paradosso Pixar',
      text: 'Anche il più grande campione dell’animazione moderna tratta i cortometraggi come una detrazione fiscale di ricerca e un recinto per il talento. I corti Pixar non generano ricavi autonomi; sono sovvenzionati interamente dal botteghino, da centinaia di milioni di dollari, del lungometraggio che li segue.',
    },
    {
      year: '2020',
      title: 'Il passo falso della Silicon Valley (Quibi)',
      text: 'Quando la tecnologia tentò finalmente una piattaforma per il formato breve, fece l’errore definitivo. Quibi raccolse 1,75 miliardi di dollari per vendere episodi televisivi brevi e spezzettati come «quick bites» da cellulare per i pendolari. Trattò il video breve come un vincolo tecnico dello smartphone, non come una forma d’arte ad alto mestiere, e combatté TikTok per il tempo morto della distrazione, dietro un paywall rigido. Chiuse in sei mesi.',
    },
  ]),
  p('Le app di streaming e i feed guidati dalla pubblicità non hanno risolto questo — l’hanno aggravato. Gli algoritmi di engagement favoriscono la durata infinita. Un motore di raccomandazione tarato per massimizzare il tempo sullo schermo non ha alcun incentivo finanziario a far emergere un capolavoro di nove minuti rispetto a un video di novanta minuti fatto per indignare.'),
  p('Per cent’anni il cortometraggio è stato trattato come un biglietto da visita, un gadget tecnologico o una rampa di lancio verso il cinema «vero». Quasi mai la destinazione.'),
  p('Non è un difetto del formato. È un fallimento strutturale di ogni modello costruito intorno a esso.'),
  h2('Colmare un vuoto culturale'),
  p('I media moderni hanno un vuoto evidente. Hollywood spende 200 milioni di dollari in sequel di fumetti. Gli algoritmi della Silicon Valley servono feed infiniti e usa e getta, progettati per catturare l’attenzione oziosa. Nessuno sta costruendo una casa d’eccellenza per il cinema breve — cortometraggi delle storie essenziali e decisive che hanno dato forma a cosa significa essere umani.'),
  p('Immagina un luogo costruito solo per il cinema breve. Storie che hanno la stessa forza dei lungometraggi, ma senza feed, senza algoritmi e senza rumore usa e getta. Solo le più grandi storie del mondo come cortometraggi — dai re caduti ai pugili, fino a Prometeo che ruba il fuoco — con la scala, lo standard, l’organizzazione e la casa permanente che meritano.'),
  p('Questo è ciò che mancava. Il cinema breve non deve competere con TikTok per il tempo morto del telefono, né infilarsi nel modello del biglietto teatrale degli anni Cinquanta o in un gadget tecnologico della Silicon Valley. Ha bisogno del veicolo giusto.'),
  p('La tesi di Fjorr è semplice: non è fallito il formato — è fallito il veicolo.'),
  p('Invece di trattare i cortometraggi come antipasti o gadget tecnologici, Fjorr li tratta come l’evento principale. Invece di nasconderli dietro paywall transazionali o servirli accanto a pubblicità invasive, Fjorr è finanziato direttamente dai suoi patroni — i Bureaux. Insieme stanno costruendo un archivio permanente, senza pubblicità, di cortometraggi di livello mondiale sotto i 20 minuti — gratis per chiunque nel mondo.'),
  p('Il breve non è mai stato un compromesso. Semplicemente non ha mai avuto un posto dove vivere — e ora ce l’ha.'),
];

const fr: EssayBlock[] = [
  p('Le court métrage n’a jamais eu de modèle économique qui tienne — seulement cent ans de modèles cassés.'),
  p('Pendant un siècle, le court métrage n’a presque jamais été quelque chose pour lequel on achetait un billet. C’était ce qui passait pendant que les gens trouvaient leur siège. Une première partie, un bouche-trou de journal filmé, un bonus collé à un menu de DVD, ou un produit d’appel pour tester un nouveau logiciel d’animation. Ce n’était pas un choix artistique ; c’est devenu toute l’identité structurelle de la catégorie : quelque chose de gratuit, attaché à autre chose, et jamais la raison pour laquelle on se déplaçait.'),
  p('Le problème de marché n’a jamais été un manque d’intérêt humain. C’était l’échec du véhicule de monétisation.'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. L’homme dans la lune, une capsule plantée dans l’œil.',
    '*Le Voyage dans la Lune*, 1902. Réalisé par Georges Méliès.'
  ),
  p('Le court métrage a exactement l’âge du cinéma. En 1902, Méliès a envoyé une fusée dans l’œil de la lune, dans l’un des premiers films narratifs jamais réalisés. Le format a eu plus d’un siècle pour trouver un modèle économique qui fonctionne. Il n’en a jamais trouvé.'),
  h2('Les mécaniques cassées de l’histoire du cinéma'),
  p('Chaque tentative de monétiser le cinéma court, du Hollywood des débuts à la Silicon Valley, a voulu forcer le format dans une boîte transactionnelle, publicitaire ou centrée sur le long métrage — et chacune s’est cassée de la même façon.'),
  timeline([
    {
      year: '1948',
      title: 'L’effondrement du système des studios',
      text: 'Dans les années 1930 et 1940, Hollywood obligeait les salles à acheter des courts avec les longs métrages, par le « block booking ». Quand la Cour suprême a déclaré la pratique illégale en 1948, avec les Paramount Decrees, la base financière des départements de courts a été détruite. Dans la décennie suivante, les studios ont démantelé systématiquement leurs unités de courts — la MGM a fini par fermer son département d’animation en 1957, et Warner Bros. a réduit sa production iconique de cartoons dans les années 1960.',
    },
    {
      year: '1953',
      title: 'Le tournant Disney',
      text: 'En 1953, Walt Disney a fermé le département de cartoons courts de son studio. Les coûts de l’animation dessinée à la main avaient explosé, mais les salles ne payaient qu’un forfait de location négligeable. Disney a compris que les courts perdaient de l’argent à chaque sortie, et a dû pivoter entièrement vers les longs métrages et la télévision financée par les annonceurs.',
    },
    {
      year: '1995–aujourd’hui',
      title: 'Le paradoxe Pixar',
      text: 'Même le plus grand champion de l’animation moderne traite les courts métrages comme une déduction fiscale de recherche et un bac à sable pour les talents. Les courts Pixar ne génèrent pas de revenus propres ; ils sont entièrement subventionnés par les centaines de millions de dollars au box-office du long métrage qui les suit.',
    },
    {
      year: '2020',
      title: 'Le raté de la Silicon Valley (Quibi)',
      text: 'Quand la tech a enfin tenté une plateforme pour le format court, elle a fait l’erreur ultime. Quibi a levé 1,75 milliard de dollars pour vendre des épisodes de télévision courts et découpés, des « quick bites » mobiles pour les trajets. Elle a traité la vidéo courte comme une contrainte technique du smartphone, et non comme un art exigeant, et s’est battue contre TikTok pour le temps mort de la distraction, derrière un mur d’abonnement. Elle a fermé en six mois.',
    },
  ]),
  p('Les apps de streaming et les fils guidés par la publicité n’ont pas réparé cela — elles l’ont aggravé. Les algorithmes d’engagement favorisent la durée infinie. Un moteur de recommandation réglé pour maximiser le temps d’écran n’a aucune incitation financière à faire remonter un chef-d’œuvre de neuf minutes plutôt qu’une vidéo de quatre-vingt-dix minutes faite pour indigner.'),
  p('Pendant cent ans, le court métrage a été traité comme une carte de visite, un gadget technologique ou un tremplin vers le « vrai » cinéma. Rarement la destination.'),
  p('Ce n’est pas un défaut du format. C’est un échec structurel de chaque modèle construit autour de lui.'),
  h2('Combler un vide culturel'),
  p('Les médias modernes ont un vide évident. Hollywood dépense 200 millions de dollars en suites de bandes dessinées. Les algorithmes de la Silicon Valley servent des fils infinis et jetables, conçus pour capter l’attention oisive. Personne ne construit une maison d’excellence pour le cinéma court — des courts métrages des histoires essentielles et décisives qui ont façonné ce que signifie être humain.'),
  p('Imaginez un lieu construit seulement pour le cinéma court. Des histoires aussi puissantes que les longs métrages, mais sans fils, sans algorithmes et sans bruit jetable. Juste les plus grandes histoires du monde en courts métrages — des rois déchus aux boxeurs, jusqu’à Prométhée volant le feu — avec l’échelle, le standard, l’organisation et la maison permanente qu’elles méritent.'),
  p('C’est ce qui manquait. Le cinéma court n’a pas à concurrencer TikTok pour le temps mort du téléphone, ni à se glisser dans le modèle du billet de cinéma des années 1950 ou dans un gadget de la Silicon Valley. Il lui faut le bon véhicule.'),
  p('La thèse de Fjorr est simple : ce n’est pas le format qui a échoué — c’est le véhicule.'),
  p('Au lieu de traiter les courts métrages comme des amuse-bouches ou des gadgets technologiques, Fjorr en fait l’événement principal. Au lieu de les cacher derrière des paywalls transactionnels ou de les servir à côté de publicités intrusives, Fjorr est financé directement par ses patrons — les Bureaux. Ensemble, ils construisent une archive permanente, sans publicité, de courts métrages de classe mondiale de moins de 20 minutes — gratuite pour quiconque dans le monde.'),
  p('Le court n’a jamais été un compromis. Il n’avait simplement nulle part où vivre — et maintenant, si.'),
];

const de: EssayBlock[] = [
  p('Der Kurzfilm hatte nie ein funktionierendes Geschäftsmodell — nur hundert Jahre kaputter Modelle.'),
  p('Ein Jahrhundert lang war der Kurzfilm fast nie etwas, für das man eine Karte kaufte. Er lief, während die Leute ihre Plätze suchten. Ein Vorprogramm, Lückenfüller in der Wochenschau, ein Bonus auf einer DVD-Disc, oder ein Lockangebot, um neue Animationssoftware zu testen. Das war keine künstlerische Entscheidung; es wurde die gesamte strukturelle Identität der Kategorie: etwas Kostenloses, an etwas anderes gehängt, und nie der Grund, warum jemand kam.'),
  p('Das Marktproblem war nie ein Mangel an menschlichem Interesse. Es war das Scheitern des Monetarisierungsvehikels.'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. Der Mann im Mond, eine Kapsel im Auge.',
    '*Le Voyage dans la Lune*, 1902. Regie: Georges Méliès.'
  ),
  p('Der Kurzfilm ist genauso alt wie das Kino selbst. 1902 schoss Méliès eine Rakete ins Auge des Mondes, in einem der ersten erzählenden Filme überhaupt. Das Format hatte über ein Jahrhundert Zeit, ein funktionierendes Geschäftsmodell zu finden. Es hat keins gefunden.'),
  h2('Die kaputte Mechanik der Kinogeschichte'),
  p('Jeder Versuch, kurzes Kino zu monetarisieren, vom frühen Hollywood bis ins Silicon Valley, zwang das Format in eine transaktionale, werbegetriebene oder spielfilmzentrierte Schachtel — und jeder brach auf dieselbe Weise.'),
  timeline([
    {
      year: '1948',
      title: 'Der Zusammenbruch des Studiosystems',
      text: 'In den 1930er und 40er Jahren zwang Hollywood die Kinos, Kurzfilme zusammen mit Spielfilmen zu kaufen, über „Block Booking“. Als der Supreme Court die Praxis 1948 in den Paramount Decrees für illegal erklärte, war das finanzielle Fundament der Kurzfilmabteilungen zerstört. Im folgenden Jahrzehnt bauten die Studios ihre Kurzfilm-Einheiten systematisch ab — MGM schloss 1957 schließlich seine Animationsabteilung, und Warner Bros. fuhr die ikonische Cartoon-Produktion in den 1960ern zurück.',
    },
    {
      year: '1953',
      title: 'Die Disney-Wende',
      text: '1953 schloss Walt Disney die eigene Abteilung für kurze Zeichentrickfilme. Die Produktionskosten handgezeichneter Animation waren explodiert, die Kinos zahlten aber nur eine pauschale, belanglose Leihgebühr. Disney erkannte, dass Kurzfilme bei jeder einzelnen Veröffentlichung Verlust machten, und musste vollständig auf abendfüllende Filme und werbefinanzierte Fernsehsendungen umschwenken.',
    },
    {
      year: '1995–heute',
      title: 'Das Pixar-Paradox',
      text: 'Selbst der größte Fürsprecher moderner Animation behandelt Kurzfilme als Forschungs-Steuerabzug und Talent-Sandkasten. Pixar-Shorts erwirtschaften keine eigenen Einnahmen; sie werden vollständig vom Kinokassen-Ergebnis in Höhe von Hunderten Millionen Dollar des Spielfilms subventioniert, der auf sie folgt.',
    },
    {
      year: '2020',
      title: 'Der Fehlschuss aus dem Silicon Valley (Quibi)',
      text: 'Als die Tech-Branche endlich eine Plattform für das kurze Format versuchte, machte sie den entscheidenden Rechenfehler. Quibi sammelte 1,75 Milliarden Dollar ein, um kurze, zerstückelte Fernsehepisoden als mobile „Quick Bites“ für Pendler zu verkaufen. Kurzes Video galt als technische Einschränkung des Smartphones, nicht als anspruchsvolle Kunstform, und konkurrierte hinter einer harten Abo-Paywall mit TikTok um tote Ablenkungszeit. Nach sechs Monaten war Schluss.',
    },
  ]),
  p('Streaming-Apps und werbegetriebene Feeds haben das nicht behoben — sie haben es verschärft. Engagement-Algorithmen bevorzugen unendliche Dauer. Eine Empfehlungsmaschine, die auf Bildschirmzeit geeicht ist, hat keinen finanziellen Anreiz, ein neunminütiges Meisterwerk über ein neunzigminütiges Empörungsvideo zu legen.'),
  p('Hundert Jahre lang galt der Kurzfilm als Visitenkarte, Tech-Spielerei oder Startrampe zum „echten“ Kino. Selten als Ziel.'),
  p('Das ist kein Fehler des Formats. Es ist ein strukturelles Scheitern jedes Modells, das darum gebaut wurde.'),
  h2('Eine kulturelle Leere füllen'),
  p('Moderne Medien haben eine offensichtliche Leere. Hollywood gibt 200 Millionen Dollar für Comic-Fortsetzungen aus. Die Algorithmen des Silicon Valley servieren endlose, wegwerfbare Feeds, gebaut, um müßige Aufmerksamkeit zu fangen. Niemand baut ein Haus mit Goldstandard für kurzes Kino — Kurzfilme der wesentlichen, entscheidenden Geschichten, die geprägt haben, was es heißt, Mensch zu sein.'),
  p('Stell dir einen Ort vor, der nur für kurzes Kino gebaut ist. Geschichten mit der Kraft von Spielfilmen, aber ohne Feeds, ohne Algorithmen und ohne wegwerfbares Rauschen. Nur die größten Geschichten der Welt als Kurzfilme — von gefallenen Königen über Preisboxer bis zu Prometheus, der das Feuer stiehlt — mit dem Maßstab, dem Standard, der Ordnung und dem dauerhaften Zuhause, das sie verdienen.'),
  p('Das hat gefehlt. Kurzes Kino muss nicht mit TikTok um tote Handyzeit konkurrieren, und es muss sich weder in ein Kinokartenmodell der 1950er noch in eine Tech-Spielerei aus dem Silicon Valley zwängen. Es braucht das richtige Vehikel.'),
  p('Die These von Fjorr ist einfach: Nicht das Format ist gescheitert — das Vehikel ist gescheitert.'),
  p('Statt Kurzfilme als Vorspeise oder Tech-Spielerei zu behandeln, macht Fjorr sie zum Hauptprogramm. Statt sie hinter transaktionalen Paywalls zu verstecken oder neben aufdringliche Werbung zu stellen, wird Fjorr direkt von seinen Patronen finanziert — den Bureaux. Gemeinsam bauen sie ein dauerhaftes, werbefreies Archiv erstklassiger Kurzfilme unter 20 Minuten — kostenlos für jeden auf der Welt.'),
  p('Kurz war nie ein Kompromiss. Es hatte nur nie einen Ort zum Leben — und jetzt hat es einen.'),
];

const es: EssayBlock[] = [
  p('El cortometraje nunca tuvo un modelo de negocio que funcionara — solo cien años de modelos rotos.'),
  p('Durante un siglo, el cortometraje casi nunca fue algo por lo que compraras una entrada. Era lo que pasaba mientras la gente encontraba su asiento. Un telonero, un relleno de noticiero, un extra pegado al menú de un DVD, o un producto gancho para probar un software de animación nuevo. Eso no fue una elección artística; se volvió toda la identidad estructural de la categoría: algo gratis, pegado a otra cosa, y nunca la razón por la que alguien aparecía.'),
  p('El problema de mercado nunca fue una falta de interés humano. Fue el fracaso del vehículo de monetización.'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. El hombre en la luna, con una cápsula clavada en el ojo.',
    '*Le Voyage dans la Lune*, 1902. Dirigida por Georges Méliès.'
  ),
  p('El cortometraje es exactamente tan viejo como el cine. En 1902, Méliès mandó un cohete al ojo de la luna, en una de las primeras películas narrativas jamás hechas. El formato tuvo más de un siglo para encontrar un modelo de negocio que funcionara. Nunca lo encontró.'),
  h2('La mecánica rota de la historia del cine'),
  p('Cada intento de monetizar el cine breve, del Hollywood temprano a Silicon Valley, trató de meter el formato en una caja transaccional, publicitaria o centrada en el largometraje — y cada uno se rompió de la misma manera.'),
  timeline([
    {
      year: '1948',
      title: 'El colapso del sistema de estudios',
      text: 'En los años 30 y 40, Hollywood obligaba a los cines a comprar cortos junto con los largometrajes mediante el «block booking». Cuando la Corte Suprema declaró la práctica ilegal en 1948, con los Paramount Decrees, la base financiera de los departamentos de cortos quedó destruida. En la década siguiente, los estudios desmantelaron de forma sistemática sus unidades de cortos — MGM acabó cerrando su departamento de animación en 1957, y Warner Bros. redujo su icónica producción de cartoons en los años 60.',
    },
    {
      year: '1953',
      title: 'El giro de Disney',
      text: 'En 1953, Walt Disney cerró el departamento de cartoons cortos de su estudio. Los costos de la animación dibujada a mano se habían disparado, pero los cines pagaban solo una tarifa plana de alquiler, insignificante. Disney entendió que los cortos perdían dinero en cada estreno, y se vio forzado a un giro completo hacia los largometrajes y la televisión financiada por anunciantes.',
    },
    {
      year: '1995–hoy',
      title: 'La paradoja Pixar',
      text: 'Incluso el mayor defensor de la animación moderna trata los cortometrajes como una deducción fiscal de investigación y un arenero de talento. Los cortos de Pixar no generan ingresos propios; los subsidia por completo la taquilla de cientos de millones de dólares del largometraje que los sigue.',
    },
    {
      year: '2020',
      title: 'El fallo de Silicon Valley (Quibi)',
      text: 'Cuando la tecnología intentó por fin una plataforma para el formato breve, cometió el error definitivo. Quibi levantó 1.750 millones de dólares para vender episodios de televisión cortos y troceados como «quick bites» móviles para quienes iban al trabajo. Trató el video breve como una limitación técnica del teléfono, no como un arte de alto oficio, y peleó con TikTok por el tiempo muerto de la distracción, detrás de un muro de suscripción. Cerró en seis meses.',
    },
  ]),
  p('Las apps de streaming y los feeds guiados por anuncios no arreglaron esto — lo agravaron. Los algoritmos de engagement favorecen la duración infinita. Un motor de recomendación afinado para maximizar el tiempo en pantalla no tiene ningún incentivo financiero para sacar a flote una obra maestra de nueve minutos por encima de un video de noventa minutos hecho para indignar.'),
  p('Durante cien años, el cortometraje fue tratado como una tarjeta de presentación, un artilugio tecnológico o una rampa hacia el cine «de verdad». Casi nunca el destino.'),
  p('Eso no es un defecto del formato. Es un fracaso estructural de cada modelo construido a su alrededor.'),
  h2('Llenar un vacío cultural'),
  p('Los medios modernos tienen un vacío obvio. Hollywood gasta 200 millones de dólares en secuelas de cómics. Los algoritmos de Silicon Valley sirven feeds infinitos y desechables, diseñados para capturar la atención ociosa. Nadie está construyendo una casa de máximo nivel para el cine breve — cortometrajes de las historias esenciales y decisivas que dieron forma a lo que significa ser humano.'),
  p('Imagina un lugar construido solo para el cine breve. Historias con tanta fuerza como los largometrajes, pero sin feeds, sin algoritmos y sin ruido desechable. Solo las historias más grandes del mundo como cortometrajes — de reyes caídos a boxeadores, hasta Prometeo robando el fuego — con la escala, el estándar, la organización y la casa permanente que merecen.'),
  p('Esto es lo que faltaba. El cine breve no necesita competir con TikTok por el tiempo muerto del teléfono, ni meterse en un modelo de entrada de cine de los años 50 o en un artilugio de Silicon Valley. Necesita el vehículo correcto.'),
  p('La tesis de Fjorr es simple: no falló el formato — falló el vehículo.'),
  p('En lugar de tratar los cortometrajes como aperitivos o artilugios tecnológicos, Fjorr los trata como el evento principal. En lugar de esconderlos detrás de muros de pago transaccionales o servirlos junto a anuncios intrusivos, Fjorr lo financian directamente sus patronos — los Bureaux. Juntos están construyendo un archivo permanente, sin anuncios, de cortometrajes de clase mundial de menos de 20 minutos — gratis para cualquiera en el mundo.'),
  p('Lo breve nunca fue un compromiso. Simplemente nunca tuvo dónde vivir — y ahora sí.'),
];

const pt: EssayBlock[] = [
  p('O curta-metragem nunca teve um modelo de negócio que funcionasse — só cem anos de modelos quebrados.'),
  p('Por um século, o curta quase nunca foi algo para o qual se comprava um bilhete. Era o que passava enquanto as pessoas achavam o lugar. Um número de abertura, um enchimento de cinejornal, um bônus grudado num menu de DVD, ou um chamariz para testar um software novo de animação. Isso não foi uma escolha artística; tornou-se toda a identidade estrutural da categoria: algo grátis, preso a outra coisa, e nunca a razão de alguém aparecer.'),
  p('O problema de mercado nunca foi falta de interesse humano. Foi o fracasso do veículo de monetização.'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. O homem na lua, com uma cápsula cravada no olho.',
    '*Le Voyage dans la Lune*, 1902. Dirigido por Georges Méliès.'
  ),
  p('O curta é exatamente tão antigo quanto o cinema. Em 1902, Méliès mandou um foguete no olho da lua, num dos primeiros filmes narrativos já feitos. O formato teve mais de um século para encontrar um modelo de negócio que funcionasse. Nunca encontrou.'),
  h2('A mecânica quebrada da história do cinema'),
  p('Cada tentativa de monetizar o cinema curto, do primeiro Hollywood ao Vale do Silício, tentou forçar o formato numa caixa transacional, movida a anúncio ou centrada no longa — e cada uma quebrou do mesmo jeito.'),
  timeline([
    {
      year: '1948',
      title: 'O colapso do sistema de estúdios',
      text: 'Nos anos 1930 e 40, Hollywood obrigava os cinemas a comprar curtas junto com os longas, pelo «block booking». Quando a Suprema Corte declarou a prática ilegal em 1948, nos Paramount Decrees, a base financeira dos departamentos de curtas foi destruída. Na década seguinte, os estúdios desmontaram de forma sistemática suas unidades de curtas — a MGM acabou fechando o departamento de animação em 1957, e a Warner Bros. reduziu sua icônica produção de cartoons nos anos 1960.',
    },
    {
      year: '1953',
      title: 'A virada da Disney',
      text: 'Em 1953, Walt Disney fechou o departamento de cartoons curtos do estúdio. Os custos da animação desenhada à mão tinham disparado, mas os cinemas pagavam só uma taxa fixa de aluguel, irrisória. A Disney entendeu que os curtas perdiam dinheiro em cada lançamento, e foi forçada a uma virada completa para os longas e a televisão financiada por anunciantes.',
    },
    {
      year: '1995–hoje',
      title: 'O paradoxo Pixar',
      text: 'Até o maior defensor da animação moderna trata os curtas como uma dedução fiscal de pesquisa e um cercado de talento. Os curtas da Pixar não geram receita própria; são subsidiados inteiramente pela bilheteria de centenas de milhões de dólares do longa que vem depois.',
    },
    {
      year: '2020',
      title: 'O tropeço do Vale do Silício (Quibi)',
      text: 'Quando a tecnologia finalmente tentou uma plataforma para o formato curto, fez o erro definitivo. A Quibi levantou 1,75 bilhão de dólares para vender episódios de televisão curtos e picados como «quick bites» de celular para quem estava no trajeto. Tratou o vídeo curto como uma limitação técnica do smartphone, não como uma arte de alto ofício, e brigou com o TikTok pelo tempo morto da distração, atrás de um paywall rígido. Fechou em seis meses.',
    },
  ]),
  p('Apps de streaming e feeds movidos a anúncio não consertaram isso — pioraram. Algoritmos de engajamento favorecem duração infinita. Um motor de recomendação afinado para maximizar tempo de tela não tem incentivo financeiro nenhum para colocar uma obra-prima de nove minutos acima de um vídeo de noventa minutos feito para indignar.'),
  p('Por cem anos, o curta foi tratado como cartão de visita, um gadget tecnológico ou uma rampa para o cinema «de verdade». Quase nunca o destino.'),
  p('Isso não é uma falha do formato. É um fracasso estrutural de cada modelo construído em volta dele.'),
  h2('Preencher um vazio cultural'),
  p('A mídia moderna tem um vazio óbvio. Hollywood gasta 200 milhões de dólares em sequências de quadrinhos. Os algoritmos do Vale do Silício servem feeds infinitos e descartáveis, feitos para capturar atenção ociosa. Ninguém está construindo uma casa de padrão máximo para o cinema curto — curtas das histórias essenciais e decisivas que moldaram o que significa ser humano.'),
  p('Imagine um lugar construído só para o cinema curto. Histórias com tanta força quanto os longas, mas sem feeds, sem algoritmos e sem ruído descartável. Só as maiores histórias do mundo como curtas — de reis caídos a pugilistas, até Prometeu roubando o fogo — com a escala, o padrão, a organização e a casa permanente que merecem.'),
  p('Era isso que faltava. O cinema curto não precisa competir com o TikTok pelo tempo morto do telefone, nem se espremer num modelo de ingresso dos anos 1950 ou num gadget do Vale do Silício. Precisa do veículo certo.'),
  p('A tese da Fjorr é simples: não foi o formato que fracassou — foi o veículo.'),
  p('Em vez de tratar curtas como aperitivo ou gadget tecnológico, a Fjorr trata os curtas como o evento principal. Em vez de escondê-los atrás de paywalls transacionais ou servi-los ao lado de anúncios invasivos, a Fjorr é financiada diretamente pelos seus patronos — os Bureaux. Juntos, estão construindo um arquivo permanente, sem anúncios, de curtas de classe mundial com menos de 20 minutos — grátis para qualquer pessoa no mundo.'),
  p('Curto nunca foi um compromisso. Só nunca teve onde morar — e agora tem.'),
];

const sv: EssayBlock[] = [
  p('Kortfilmen har aldrig haft en affärsmodell som fungerat — bara hundra år av trasiga modeller.'),
  p('I ett sekel var kortfilmen nästan aldrig något man köpte biljett för att se. Den spelades medan folk hittade sina platser. Ett förband, ett utfyllnadsnummer i journalfilmen, ett bonusinslag klistrat på en dvd-meny, eller en lockvara för att testa ny animeringsmjukvara. Det var inget konstnärligt val; det blev hela kategorins strukturella identitet: något gratis, fäst vid något annat, och aldrig anledningen till att någon dök upp.'),
  p('Marknadsproblemet var aldrig brist på mänskligt intresse. Det var ett misslyckande för monetariseringsvehikeln.'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. Mannen i månen, med en kapsel i ögat.',
    '*Le Voyage dans la Lune*, 1902. Regi: Georges Méliès.'
  ),
  p('Kortfilmen är precis lika gammal som filmen själv. 1902 skickade Méliès en raket i månens öga, i en av de första berättande filmerna som någonsin gjorts. Formatet har haft över ett sekel på sig att hitta en affärsmodell som fungerar. Det har aldrig gjort det.'),
  h2('Den trasiga mekaniken i filmhistorien'),
  p('Varje försök att tjäna pengar på kortfilm, från det tidiga Hollywood till Silicon Valley, försökte tvinga in formatet i en transaktionell, annonsdriven eller långfilmscentrerad låda — och vartenda ett gick sönder på samma sätt.'),
  timeline([
    {
      year: '1948',
      title: 'Studiosystemets kollaps',
      text: 'På 1930- och 40-talen tvingade Hollywood biograferna att köpa kortfilmer tillsammans med långfilmer, genom «block booking». När Högsta domstolen förklarade praktiken olaglig 1948, i Paramount Decrees, förstördes den ekonomiska grunden för kortfilmsavdelningarna. Under det följande decenniet monterade studiorna systematiskt ner sina kortfilmsenheter — MGM stängde till slut sin animationsavdelning 1957, och Warner Bros. skalade ner sin ikoniska tecknade produktion under 1960-talet.',
    },
    {
      year: '1953',
      title: 'Disney-svängen',
      text: '1953 stängde Walt Disney studions avdelning för korta tecknade filmer. Produktionskostnaderna för handritad animation hade skjutit i höjden, men biograferna betalade bara en fast, försumbar hyravgift. Disney insåg att kortfilmerna förlorade pengar på varje enskild release, och tvingades svänga helt mot långfilm och reklamfinansierad television.',
    },
    {
      year: '1995–idag',
      title: 'Pixar-paradoxen',
      text: 'Till och med den moderna animationens största förkämpe behandlar kortfilm som ett forskningsavdrag och en sandlåda för talang. Pixars kortfilmer genererar inga egna intäkter; de subventioneras helt av den hundratals miljoner dollar stora kassan för långfilmen som följer efter.',
    },
    {
      year: '2020',
      title: 'Felsatsen från Silicon Valley (Quibi)',
      text: 'När tech äntligen försökte bygga en plattform för det korta formatet gjorde de den yttersta felräkningen. Quibi tog in 1,75 miljarder dollar för att sälja korta, sönderhackade tv-avsnitt som mobila «quick bites» för pendlare. De behandlade kort video som en teknisk begränsning i telefonen, inte som en konstform med högt hantverk, och slogs med TikTok om död distraktionstid bakom en hård prenumerationsvägg. Det dog på sex månader.',
    },
  ]),
  p('Streamingappar och annonsdrivna flöden löste inte det här — de förvärrade det. Engagemangsalgoritmer gynnar oändlig längd. En rekommendationsmotor inställd på att maximera skärmtid har noll ekonomiskt incitament att lyfta ett nio minuter långt mästerverk över en nittio minuter lång film gjord för att reta upp.'),
  p('I hundra år behandlades kortfilmen som ett visitkort, en teknikgimmick eller en avfyrningsramp mot «riktig» film. Sällan målet.'),
  p('Det är inte ett fel i formatet. Det är ett strukturellt misslyckande för varje modell som byggts runt det.'),
  h2('Att fylla ett kulturellt tomrum'),
  p('Moderna medier har ett uppenbart tomrum. Hollywood lägger 200 miljoner dollar på serietidningsuppföljare. Silicon Valleys algoritmer serverar oändliga, engångsflöden, byggda för att fånga sysslolös uppmärksamhet. Ingen bygger ett hem med guldstandard för kortfilm — kortfilmer av de väsentliga, avgörande berättelserna som format vad det betyder att vara människa.'),
  p('Föreställ dig en plats byggd enbart för kortfilm. Berättelser med samma kraft som långfilm, men utan flöden, utan algoritmer och utan engångsbrus. Bara världens största berättelser som kortfilmer — från fallna kungar till prisboxare till Prometheus som stjäl elden — med den skala, den standard, den ordning och det permanenta hem de förtjänar.'),
  p('Det var det som saknades. Kortfilm behöver inte tävla med TikTok om död telefontid, och den behöver inte klämmas in i en biobiljettsmodell från 1950-talet eller en teknikgimmick från Silicon Valley. Den behöver rätt vehikel.'),
  p('Tesen är enkel: det var inte formatet som misslyckades — det var vehikeln.'),
  p('I stället för att behandla kortfilmer som förrätter eller teknikgimmickar behandlar Fjorr dem som huvudnumret. I stället för att gömma dem bakom transaktionella betalväggar eller servera dem bredvid påträngande reklam finansieras Fjorr direkt av sina patroner — Bureaux. Tillsammans bygger de ett permanent, reklamfritt arkiv av kortfilmer i världsklass under 20 minuter — gratis för vem som helst i världen.'),
  p('Kort var aldrig en kompromiss. Det hade bara aldrig någonstans att bo — och nu har det det.'),
];

const hi: EssayBlock[] = [
  p('लघु फ़िल्म का कभी कोई चलता हुआ कारोबारी मॉडल नहीं रहा — सिर्फ़ सौ साल के टूटे मॉडल रहे।'),
  p('एक सदी तक लघु फ़िल्म लगभग कभी वह चीज़ नहीं रही जिसके लिए टिकट खरीदा जाता। वह तब चलती थी जब लोग अपनी सीट ढूँढ रहे होते थे। एक ओपनिंग ऐक्ट, न्यूज़रील की भराई, डीवीडी मेनू पर चिपका बोनस, या नया एनिमेशन सॉफ़्टवेयर आज़माने के लिए घाटे का माल। यह कलात्मक चुनाव नहीं था; यह श्रेणी की पूरी संरचनात्मक पहचान बन गया: कुछ मुफ़्त, किसी और चीज़ से जुड़ा, और कभी वह वजह नहीं जिसके लिए कोई आता।'),
  p('बाज़ार की समस्या कभी मानवीय रुचि की कमी नहीं थी। यह कमाई के वाहन की असफलता थी।'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. चाँद पर आदमी, आँख में धँसी एक कैप्सूल।',
    '*Le Voyage dans la Lune*, 1902. निर्देशक Georges Méliès.'
  ),
  p('लघु फ़िल्म सिनेमा जितनी ही पुरानी है। 1902 में Méliès ने चाँद की आँख में एक रॉकेट भेजा, अब तक बनी पहली कथा-फ़िल्मों में से एक में। इस प्रारूप को एक चलता हुआ कारोबारी मॉडल खोजने के लिए एक सदी से ज़्यादा मिला। उसने कभी नहीं खोजा।'),
  h2('सिनेमा के इतिहास की टूटी यांत्रिकी'),
  p('लघु सिनेमा से पैसे कमाने की हर कोशिश, शुरुआती Hollywood से Silicon Valley तक, ने प्रारूप को एक लेन-देन, विज्ञापन, या फ़ीचर-केंद्रित डिब्बे में ठूँसने की कोशिश की — और हर एक उसी तरह टूटा।'),
  timeline([
    {
      year: '1948',
      title: 'स्टूडियो व्यवस्था का पतन',
      text: '1930 और 40 के दशक में Hollywood थिएटरों को «block booking» के ज़रिए फ़ीचर के साथ शॉर्ट खरीदने पर मजबूर करता था। जब 1948 में Supreme Court ने Paramount Decrees में इस प्रथा को ग़ैरक़ानूनी ठहराया, शॉर्ट विभागों की आर्थिक नींव टूट गई। अगले दशक में स्टूडियो ने अपनी शॉर्ट इकाइयाँ व्यवस्थित रूप से खत्म कर दीं — MGM ने 1957 में अपना एनिमेशन विभाग बंद कर दिया, और Warner Bros. ने 1960 के दशक में अपनी प्रतिष्ठित कार्टून प्रोडक्शन घटा दी।',
    },
    {
      year: '1953',
      title: 'Disney का मोड़',
      text: '1953 तक Walt Disney ने अपने स्टूडियो का शॉर्ट कार्टून विभाग बंद कर दिया। हाथ से बनाई एनिमेशन की लागत बहुत बढ़ चुकी थी, पर थिएटर सिर्फ़ एक सपाट, नगण्य किराया देते थे। Disney ने देखा कि हर रिलीज़ पर शॉर्ट घाटे में रहते हैं, और पूरी तरह फ़ीचर फ़िल्मों तथा विज्ञापन-पोषित टेलीविज़न की ओर मुड़ना पड़ा।',
    },
    {
      year: '1995–अब',
      title: 'Pixar का विरोधाभास',
      text: 'आधुनिक एनिमेशन का सबसे बड़ा समर्थक भी लघु फ़िल्मों को शोध का टैक्स राइट-ऑफ़ और प्रतिभा का सैंडबॉक्स मानता है। Pixar के शॉर्ट अपनी आय नहीं कमाते; उन्हें पूरी तरह उस फ़ीचर फ़िल्म की करोड़ों डॉलर की बॉक्स ऑफ़िस आय से सब्सिडी मिलती है जो उनके बाद आती है।',
    },
    {
      year: '2020',
      title: 'Silicon Valley की चूक (Quibi)',
      text: 'जब तकनीक ने आख़िरकार एक शॉर्ट-फ़ॉर्म प्लेटफ़ॉर्म आज़माया, उसने सबसे बड़ी ग़लत गणना की। Quibi ने 1.75 अरब डॉलर जुटाए ताकि छोटे, काटे हुए टेलीविज़न एपिसोड यात्रियों के लिए मोबाइल «quick bites» बनकर बिकें। उसने छोटे वीडियो को स्मार्टफ़ोन की तकनीकी सीमा माना, उच्च-शिल्प कला नहीं, और एक सख्त सब्सक्रिप्शन दीवार के पीछे TikTok से खाली ध्यान के समय के लिए लड़ा। छह महीने में बंद हो गया।',
    },
  ]),
  p('स्ट्रीमिंग ऐप और विज्ञापन-चालित फ़ीड ने इसे ठीक नहीं किया — बढ़ा दिया। एंगेजमेंट एल्गोरिदम अनंत अवधि को तरजीह देते हैं। स्क्रीन-टाइम बढ़ाने के लिए बना सुझाव इंजन के पास कोई आर्थिक कारण नहीं कि वह नब्बे मिनट के आक्रोश-वीडियो के ऊपर नौ मिनट की उत्कृष्ट कृति लाए।'),
  p('सौ साल तक लघु फ़िल्म को विज़िटिंग कार्ड, तकनीकी गैजेट, या «असली» सिनेमा की सीढ़ी माना गया। शायद ही कभी मंज़िल।'),
  p('यह प्रारूप की खामी नहीं है। यह उसके चारों ओर बने हर मॉडल की संरचनात्मक असफलता है।'),
  h2('एक सांस्कृतिक खालीपन भरना'),
  p('आधुनिक मीडिया में एक साफ़ खालीपन है। Hollywood कॉमिक सीक्वल पर 200 मिलियन डॉलर खर्च करती है। Silicon Valley के एल्गोरिदम अंतहीन, फेंकने लायक फ़ीड परोसते हैं, खाली ध्यान पकड़ने के लिए। कोई लघु सिनेमा के लिए स्वर्ण-मानक का घर नहीं बना रहा — उन अनिवार्य, निर्णायक कहानियों की लघु फ़िल्में जिन्होंने इंसान होने का अर्थ गढ़ा।'),
  p('एक ऐसी जगह की कल्पना करें जो सिर्फ़ लघु सिनेमा के लिए बनी हो। कहानियाँ फ़ीचर जितनी ताक़तवर, पर बिना फ़ीड, बिना एल्गोरिदम, बिना फेंकने लायक शोर के। बस दुनिया की सबसे बड़ी कहानियाँ लघु फ़िल्मों के रूप में — गिरे राजाओं से मुक्केबाज़ों तक, Prometheus के आग चुराने तक — उस पैमाने, मानक, व्यवस्था और स्थायी घर के साथ जिसके वे हक़दार हैं।'),
  p('यही गायब था। लघु सिनेमा को TikTok से फ़ोन के खाली समय के लिए लड़ने की ज़रूरत नहीं, न 1950 के थिएटर-टिकट मॉडल में समाने की, न Silicon Valley के तकनीकी गैजेट बनने की। उसे सही वाहन चाहिए।'),
  p('Fjorr की थीसिस सरल है: प्रारूप असफल नहीं हुआ — वाहन असफल हुआ।'),
  p('लघु फ़िल्मों को ऐपेटाइज़र या तकनीकी गैजेट मानने के बजाय Fjorr उन्हें मुख्य कार्यक्रम मानता है। उन्हें लेन-देन वाली पेवॉल के पीछे छिपाने या घुसपैठिया विज्ञापनों के साथ परोसने के बजाय Fjorr को सीधे उसके संरक्षक देते हैं — Bureaux। साथ मिलकर वे 20 मिनट से कम की विश्व-स्तरीय लघु फ़िल्मों का एक स्थायी, विज्ञापन-रहित संग्रह बना रहे हैं — दुनिया में किसी के लिए भी मुफ़्त।'),
  p('लघु कभी समझौता नहीं था। बस उसके पास रहने की जगह नहीं थी — और अब है।'),
];

const ko: EssayBlock[] = [
  p('단편 영화는 한 번도 제대로 된 사업 모델을 가진 적이 없다. 백 년 동안 깨진 모델만 있었다.'),
  p('한 세기 동안 단편은 표를 사서 보러 가는 것이 거의 아니었다. 사람들이 자리를 찾는 동안 나오는 것이었다. 오프닝, 뉴스 릴의 메움, DVD 메뉴에 붙은 보너스, 새 애니메이션 소프트웨어를 시험하는 미끼 상품. 그것은 예술적 선택이 아니었다. 범주 전체의 구조적 정체성이 되었다. 공짜이고, 다른 것에 붙어 있고, 아무도 그것 때문에 오지 않는 것.'),
  p('시장의 문제는 사람의 관심이 부족해서가 아니었다. 돈을 버는 그릇이 실패한 것이었다.'),
  figure(
    'Le Voyage dans la Lune (1902) — Georges Méliès. 달에 사는 남자, 눈에 박힌 캡슐.',
    '*Le Voyage dans la Lune*, 1902. 감독 Georges Méliès.'
  ),
  p('단편은 영화 자체와 같은 나이다. 1902년 Méliès는 지금까지 만들어진 최초의 서사 영화 중 하나에서 달의 눈에 로켓을 보냈다. 이 형식은 작동하는 사업 모델을 찾는 데 한 세기 이상을 썼다. 끝내 찾지 못했다.'),
  h2('영화사의 깨진 역학'),
  p('초기 Hollywood에서 Silicon Valley까지, 단편 영화로 돈을 벌려는 시도는 모두 이 형식을 거래, 광고, 또는 장편 중심의 상자에 밀어 넣으려 했다. 그리고 전부 같은 방식으로 깨졌다.'),
  timeline([
    {
      year: '1948',
      title: '스튜디오 체제의 붕괴',
      text: '1930년대와 40년대에 Hollywood는 «block booking»으로 극장에 장편과 함께 단편을 사게 했다. 1948년 대법원이 Paramount Decrees로 그 관행을 불법이라 선언하자, 단편 부서의 재정 기반은 무너졌다. 이어진 십 년 동안 스튜디오는 단편 부서를 체계적으로 해체했다. MGM은 1957년 애니메이션 부서를 닫았고, Warner Bros.는 1960년대에 상징적인 만화 제작을 줄였다.',
    },
    {
      year: '1953',
      title: 'Disney의 전환',
      text: '1953년 Walt Disney는 스튜디오의 단편 만화 부서를 닫았다. 손으로 그린 애니메이션의 제작비는 치솟았지만, 극장은 정액의 보잘것없는 대여료만 냈다. Disney는 단편이 개봉할 때마다 손해를 본다는 것을 알았고, 장편과 광고주가 대는 텔레비전으로 완전히 돌아서야 했다.',
    },
    {
      year: '1995–현재',
      title: 'Pixar의 역설',
      text: '현대 애니메이션의 가장 큰 옹호자조차 단편을 연구 개발 세금 공제와 인재의 모래상자로 다룬다. Pixar 단편은 자체 수익을 내지 않는다. 그 뒤를 잇는 장편의 수억 달러 박스오피스가 전부 떠받친다.',
    },
    {
      year: '2020',
      title: 'Silicon Valley의 오산 (Quibi)',
      text: '기술이 마침내 짧은 형식의 플랫폼을 시도했을 때, 가장 큰 오산을 했다. Quibi는 17억 5천만 달러를 모아, 잘게 자른 짧은 텔레비전 에피소드를 통근자를 위한 모바일 «quick bites»로 팔려 했다. 짧은 영상을 높은 공예가 아니라 스마트폰의 기술 제약으로 다루었고, 단단한 구독 장벽 뒤에서 TikTok과 빈 주의력 시간을 두고 싸웠다. 여섯 달 만에 접었다.',
    },
  ]),
  p('스트리밍 앱과 광고 피드는 이것을 고치지 못했다. 더 키웠다. 참여 알고리즘은 끝없는 길이를 선호한다. 화면 시간을 최대화하도록 조율된 추천 엔진은, 구십 분짜리 분노 유발 영상 위에 구 분짜리 걸작을 올릴 금전적 이유가 전혀 없다.'),
  p('백 년 동안 단편은 명함, 기술 장난감, 또는 «진짜» 영화로 가는 발사대로 취급되었다. 목적지인 경우는 드물었다.'),
  p('이것은 형식의 결함이 아니다. 그 주위에 세워진 모든 모델의 구조적 실패다.'),
  h2('문화의 빈자리를 채우다'),
  p('현대 미디어에는 분명한 빈자리가 있다. Hollywood는 만화 속편에 2억 달러를 쓴다. Silicon Valley 알고리즘은 빈 주의를 붙잡도록 설계된, 끝없고 버려지는 피드를 내놓는다. 아무도 단편 영화의 최고 기준이 되는 집을 짓고 있지 않다. 사람이 된다는 것의 의미를 만든, 필수적이고 결정적인 이야기들의 단편을.'),
  p('단편 영화만을 위해 지어진 장소를 상상해 보라. 장편만큼 힘 있는 이야기, 그러나 피드도, 알고리즘도, 버려지는 소음도 없는 곳. 세계의 가장 큰 이야기들이 단편으로만 있다. 무너진 왕에서 권투 선수까지, 불을 훔친 Prometheus까지. 그들이 마땅히 받아야 할 규모, 기준, 질서, 그리고 영원한 집과 함께.'),
  p('빠져 있던 것은 이것이었다. 단편 영화는 빈 전화 시간을 두고 TikTok과 겨룰 필요가 없고, 1950년대 극장 티켓 모델이나 Silicon Valley의 기술 장난감에 끼어들 필요도 없다. 올바른 그릇이 필요하다.'),
  p('Fjorr의 명제는 단순하다. 실패한 것은 형식이 아니다. 그릇이다.'),
  p('Fjorr는 단편을 전채나 기술 장난감으로 다루지 않고, 본 행사로 다룬다. 거래용 페이월 뒤에 숨기거나 끼어드는 광고 옆에 내놓지 않는다. Fjorr는 후원자, 곧 Bureaux가 직접 댄다. 함께 그들은 20분 미만의 세계적 단편을 모은, 영구적이고 광고 없는 아카이브를 짓고 있다. 세상 누구나 무료로 볼 수 있다.'),
  p('짧음은 한 번도 타협이 아니었다. 살 곳이 없었을 뿐이다. 이제는 있다.'),
];

const ja: EssayBlock[] = [
  p('短編映画には、一度も機能する事業モデルがなかった。壊れたモデルが百年続いただけだ。'),
  p('一世紀のあいだ、短編はほとんど、切符を買って見に行くものではなかった。人が席を探すあいだに流れるものだった。前座、ニュース映画の埋め草、DVDメニューに付けた特典、新しいアニメーションソフトを試すための赤字商品。それは芸術上の選択ではなかった。カテゴリー全体の構造的な正体になった。無料で、何か別のものにくっついていて、誰もそれのために来ないもの。'),
  p('市場の問題は、人の関心が足りなかったことではない。収益の器が失敗したことだ。'),
  figure(
    'Le Voyage dans la Lune（1902）— Georges Méliès。月の男、目に突き刺さったカプセル。',
    '*Le Voyage dans la Lune*、1902年。監督 Georges Méliès。'
  ),
  p('短編は、映画そのものと同じ年齢だ。1902年、Mélièsは、これまでに作られた最初の物語映画のひとつで、月の目にロケットを撃ち込んだ。この形式には、機能する事業モデルを見つけるために一世紀以上があった。一度も見つけなかった。'),
  h2('映画史の壊れた力学'),
  p('初期のHollywoodからSilicon Valleyまで、短い映画で稼ごうとした試みはどれも、この形式を取引、広告、あるいは長編中心の箱に押し込めようとした。そしてどれも同じ壊れ方をした。'),
  timeline([
    {
      year: '1948',
      title: 'スタジオ・システムの崩壊',
      text: '1930年代と40年代、Hollywoodは「ブロック・ブッキング」で、劇場に長編と一緒に短編を買わせた。1948年、最高裁がParamount Decreesでその慣行を違法とすると、短編部門の財政基盤は壊れた。続く十年、スタジオは短編部門を組織的に解体した。MGMは1957年にアニメーション部門を閉じ、Warner Bros.は1960年代に象徴的な漫画制作を縮小した。',
    },
    {
      year: '1953',
      title: 'Disneyの転換',
      text: '1953年までにWalt Disneyは、スタジオの短編漫画部門を閉じた。手描きアニメーションの制作費は跳ね上がっていたが、劇場が払うのは定額の、ごくわずかなレンタル料だけだった。Disneyは、短編が公開のたびに損をすると知り、長編と、広告主が払うテレビへと完全に舵を切らざるを得なかった。',
    },
    {
      year: '1995–現在',
      title: 'Pixarの逆説',
      text: '現代アニメーション最大の擁護者でさえ、短編を研究開発の税控除と、才能の砂場として扱う。Pixarの短編は単独の収益を生まない。あとに続く長編の、数億ドルの興行収入がすべてを賄っている。',
    },
    {
      year: '2020',
      title: 'Silicon Valleyの誤算（Quibi）',
      text: 'テックがついに短い形式のプラットフォームを試みたとき、最大の誤算をした。Quibiは17億5千万ドルを集め、短く切り刻んだテレビのエピソードを、通勤者向けのモバイル「クイック・バイツ」として売ろうとした。短い映像を、高度な技芸ではなくスマートフォンの技術的制約として扱い、硬いサブスクリプションの壁の向こうで、空き時間の気晴らしをめぐってTikTokと争った。六か月で畳んだ。',
    },
  ]),
  p('ストリーミングのアプリと、広告で動くフィードは、これを直さなかった。悪化させた。エンゲージメントのアルゴリズムは、無限の長さを好む。画面時間を最大化するよう調整された推薦エンジンには、九十分の怒りを誘う動画より、九分の傑作を上に出す金銭的な理由がひとつもない。'),
  p('百年のあいだ、短編は名刺、技術の仕掛け、あるいは「本物」の映画への発射台として扱われた。目的地であることは、めったになかった。'),
  p('それは形式の欠陥ではない。その周りに組まれた、あらゆるモデルの構造的な失敗だ。'),
  h2('文化の空白を埋める'),
  p('現代のメディアには、明らかな空白がある。Hollywoodはコミックの続編に2億ドルを使う。Silicon Valleyのアルゴリズムは、空いた注意を掴むために設計された、終わりのない使い捨てフィードを出す。誰も、短い映画のための黄金基準の家を建てていない。人であることの意味を形づくった、不可欠で決定的な物語の短編を。'),
  p('短い映画のためだけに建てられた場所を想像してほしい。長編と同じ力を持つ物語。ただしフィードもなく、アルゴリズムもなく、使い捨ての雑音もない。世界でいちばん大きな物語が、短編としてだけある。落ちた王から拳闘士まで、火を盗むPrometheusまで。彼らにふさわしい規模、基準、秩序、そして恒久の家とともに。'),
  p('欠けていたのはこれだ。短い映画は、空いた電話の時間をめぐってTikTokと争う必要はない。1950年代の劇場チケットのモデルにも、Silicon Valleyの技術の仕掛けにも、押し込む必要はない。正しい器が要る。'),
  p('Fjorrの命題は単純だ。失敗したのは形式ではない。器だ。'),
  p('Fjorrは短編を前菜や技術の仕掛けとして扱わない。本番として扱う。取引のペイウォールの向こうに隠さず、割り込む広告の横に出さない。Fjorrを直接支えるのはパトロン、Bureauxだ。共に彼らは、20分未満の世界水準の短編を集めた、恒久で広告のないアーカイブを建てている。世界の誰でも、無料で見られる。'),
  p('短さは、一度も妥協ではなかった。住む場所がなかっただけだ。今はある。'),
];

const zhTw: EssayBlock[] = [
  p('短片從來沒有過一個能運作的商業模式——只有一百年破掉的模式。'),
  p('一個世紀裡，短片幾乎從來不是你買票去看的東西。它是人們找座位時播的東西。暖場、新聞片的填充、貼在 DVD 選單上的花絮，或是用來試新動畫軟體的虧本品。那不是藝術選擇；它成了這個類別全部的結構身份：免費的、附在別的東西上、從來不是任何人出現的理由。'),
  p('市場的問題從來不是人沒有興趣。是變現的載體失敗了。'),
  figure(
    'Le Voyage dans la Lune（1902）— Georges Méliès。月亮上的人，眼睛裡嵌著一枚艙體。',
    '*Le Voyage dans la Lune*，1902。導演 Georges Méliès。'
  ),
  p('短片和電影本身一樣老。1902 年，Méliès 在最早的敘事電影之一裡，把一枚火箭送進月亮的眼睛。這個形式有超過一個世紀去找一個能運作的商業模式。它從來沒找到。'),
  h2('電影史裡壞掉的機制'),
  p('每一次把短片變成錢的嘗試，從早期 Hollywood 到 Silicon Valley，都想把這個形式塞進交易、廣告，或是長片中心的盒子裡——每一次都用同一種方式壞掉。'),
  timeline([
    {
      year: '1948',
      title: '片廠制度崩塌',
      text: '1930 與 40 年代，Hollywood 用「block booking」強迫戲院把短片和長片一起買下。1948 年，最高法院在 Paramount Decrees 裡宣布這種做法違法，短片部門的財務基礎就被拆掉了。接下來十年，片廠有系統地解散短片單位——MGM 在 1957 年關閉動畫部門，Warner Bros. 在 1960 年代縮減它標誌性的卡通製作。',
    },
    {
      year: '1953',
      title: 'Disney 的轉向',
      text: '到了 1953 年，Walt Disney 關掉片廠專做短篇卡通的部門。手繪動畫的成本暴漲，戲院卻只付一筆固定、微不足道的租金。Disney 明白短片每一次上映都在虧錢，只好完全轉向長片，以及由廣告主付錢的電視。',
    },
    {
      year: '1995–至今',
      title: 'Pixar 的悖論',
      text: '就連現代動畫最有力的擁護者，也把短片當成研發抵稅和人才沙盒。Pixar 的短片不產生自己的收入；它們完全由後面那部長片、數億美元的票房來補貼。',
    },
    {
      year: '2020',
      title: 'Silicon Valley 的失算（Quibi）',
      text: '當科技終於嘗試做一個短形式平台，它犯了最徹底的誤算。Quibi 募了 17.5 億美元，要把切碎的短篇電視集數，當成通勤者手機上的「quick bites」來賣。它把短片當成智慧型手機的技術限制，而不是高工藝的藝術，並在一道硬訂閱牆後面，和 TikTok 爭搶空閒的分心時間。六個月就收了。',
    },
  ]),
  p('串流應用和廣告驅動的動態沒有修好這件事——它們把它加重了。參與演算法偏愛無限的長度。一個為了拉高螢幕時間而調校的推薦引擎，沒有任何財務理由把九分鐘的傑作排在九十分鐘、用來激怒人的影片前面。'),
  p('一百年來，短片被當成名片、科技噱頭，或是通往「真正」電影的跳板。很少是目的地。'),
  p('這不是形式的缺陷。這是圍著它建起來的每一個模型的結構性失敗。'),
  h2('補上一個文化的空缺'),
  p('當代媒體有一個明顯的空缺。Hollywood 在漫畫續集上花兩億美元。Silicon Valley 的演算法端出無盡、用過即丟的動態，設計來抓住空閒的注意力。沒有人在為短片電影建造一個黃金標準的家——那些塑造了「身為人」的、根本而關鍵的故事，做成短片。'),
  p('想像一個只為短片電影而建的地方。故事和長片一樣有力，但沒有動態、沒有演算法、沒有用過即丟的噪音。只有世界上最偉大的故事，作為短片——從隕落的國王到拳擊手，到偷火的 Prometheus——配上它們應得的規模、標準、秩序，和永久的家。'),
  p('缺的就是這個。短片電影不必和 TikTok 爭手機上的空閒時間，也不必擠進 1950 年代的戲票模型，或是 Silicon Valley 的科技噱頭。它需要對的載體。'),
  p('Fjorr 的命題很簡單：失敗的不是形式——是載體。'),
  p('Fjorr 不把短片當成開胃菜或科技噱頭，而把它們當成主場。不把它們藏在交易式付費牆後面，也不把它們和侵入式廣告一起端上來。Fjorr 由它的資助者直接支付——Bureaux。他們一起在建造一座永久、沒有廣告的檔案，收世界級、不到 20 分鐘的短片——世界上任何人都免費可看。'),
  p('短，從來不是妥協。它只是從來沒有地方住——現在有了。'),
];

export const ESSAY_FAILURE_LOCALES: Partial<Record<AppLocale, EssayBlock[]>> = {
  it,
  fr,
  de,
  es,
  pt,
  sv,
  hi,
  ko,
  ja,
  'zh-tw': zhTw,
};
