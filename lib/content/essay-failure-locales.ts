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

const es: EssayBlock[] = [
  p('El cortometraje no ha tenido un modelo de negocio que funcionara en un siglo.'),
  p('Empezó como el acto principal. El 28 de diciembre de 1895, los hermanos Lumière cobraron entrada en el sótano de un café de París y proyectaron diez cortometrajes. Georges Méliès estaba entre el público. Pidió comprar la máquina y se la negaron. Siete años después, disparó una cápsula al ojo de la Luna.'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès. El hombre de la Luna con una cápsula clavada en el ojo.',
    '*Le Voyage dans la Lune*, 1902. Dirigida por Georges Méliès.'
  ),
  p('Después se impusieron los largometrajes. El corto pasó a ser lo que se proyectaba mientras la gente encontraba su asiento: un telonero, relleno de noticiero, un extra en el menú de un DVD. No fue una decisión artística. Se convirtió en toda la identidad del formato: gratis, pegado a otra cosa, y nunca la razón por la que alguien acudía.'),
  p('El problema nunca fue la falta de interés. Fue el negocio alrededor del formato.'),
  h2('Cada intento de arreglarlo se rompió del mismo modo'),
  p('Cada uno intentó meter el cortometraje en una entrada, un anuncio o un largometraje.'),
  timeline([
    {
      year: '1948',
      title: 'Los estudios pierden el control.',
      text: 'Durante años, los estudios obligaron a los cines a aceptar cortos empaquetados con sus largometrajes. En 1948 la Corte Suprema falló en contra de los estudios. Los acuerdos que siguieron acabaron con la práctica y desmantelaron sus cadenas de cines, y la televisión se llevó al público. En la década siguiente, los estudios cerraron sus unidades de cortos. La MGM cerró su estudio de dibujos en 1957, y la Warner Bros. fue apagando sus cartoons hasta finales de los años sesenta.',
    },
    {
      year: 'Los años 50',
      title: 'Disney da un paso atrás.',
      text: 'En la década posterior a 1953, Disney fue retirando sus cortos de cine y trasladó su peso a los largometrajes y a la televisión.',
    },
    {
      year: 'Hoy',
      title: 'La paradoja Pixar.',
      text: 'Pixar, el defensor más conocido de los cortos, los usa como un laboratorio de talento. Se proyectan antes de los largometrajes y los paga, en gran parte, lo que ganan esos largometrajes.',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'Quibi reunió 1.750 millones de dólares para vender episodios en bocados de diez minutos para gente en movimiento, detrás de una suscripción, frente a apps gratuitas como TikTok. Cerró seis meses después del lanzamiento. Apostó por el teléfono, no por las películas.',
    },
  ]),
  p('El streaming no arregló esto. Lo empeoró. Los feeds ajustados al tiempo de pantalla tienen pocas razones para mostrarte una obra maestra de nueve minutos en lugar de un video de noventa minutos hecho para indignar.'),
  p('Durante cien años, el corto fue una tarjeta de presentación, un experimento técnico o una rampa hacia el cine “de verdad”, y rara vez el destino. Incluso los mejores curadores en línea sirven sobre todo a cineastas que van camino de otra cosa.'),
  h2('Lo que falta'),
  p('Hollywood gasta 200 millones de dólares o más en secuelas de cómics. Los feeds sirven un caudal sin fin, hecho para retener la atención ociosa. El cortometraje no tiene una casa hecha para las historias mismas, las decisivas que dieron forma a lo que significa ser humano.'),
  p('Imagina un lugar hecho solo para el cine breve. Historias con la fuerza de los largometrajes, sin feeds, sin algoritmos y sin ruido desechable. Las más grandes historias del mundo como cortometrajes, de reyes caídos a boxeadores y a Prometeo robando el fuego, con la escala, el estándar y la casa permanente que merecen.'),
  p('El cine breve no tiene que competir con TikTok por el tiempo ocioso del teléfono, ni meterse en un modelo de entrada de los años cincuenta, ni convertirse en un experimento técnico. Necesita una casa.'),
  p('La tesis de Fjorr es simple: el formato no falló. Perdió su casa.'),
  p('Fjorr trata los cortometrajes como el acto principal, no como aperitivos ni trucos. No hay muros de pago ni anuncios. Fjorr lo financian sus patronos, los Bureaux, y sus socios. Está construyendo un archivo permanente de cortometrajes de nivel mundial, siempre de 20 minutos o menos, gratis para cualquier persona en el mundo.'),
  p('Lo breve nunca fue un compromiso. Solo perdió su casa, y ahora tiene una.'),
];

const fr: EssayBlock[] = [
  p('Le court métrage n’a pas eu de modèle économique qui tienne depuis un siècle.'),
  p('Il a commencé comme l’événement principal. Le 28 décembre 1895, les frères Lumière font payer l’entrée dans le sous-sol d’un café de Paris et projettent dix courts métrages. Georges Méliès est dans la salle. Il demande à acheter la machine et essuie un refus. Sept ans plus tard, il envoie une capsule dans l’œil de la Lune.'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès. L’homme dans la Lune, une capsule plantée dans l’œil.',
    '*Le Voyage dans la Lune*, 1902. Réalisé par Georges Méliès.'
  ),
  p('Puis les longs métrages ont pris la place. Le court est devenu ce qui passait pendant que les gens trouvaient leur siège : une première partie, un bouche-trou de journal filmé, un bonus sur un menu de DVD. Ce n’était pas un choix artistique. C’est devenu toute l’identité du format : gratuit, attaché à autre chose, et jamais la raison pour laquelle on se déplaçait.'),
  p('Le problème n’a jamais été un manque d’intérêt. C’était l’économie autour du format.'),
  h2('Chaque tentative pour le réparer s’est cassée de la même façon'),
  p('Chacune a essayé de faire entrer le court métrage dans un billet, une publicité ou un long métrage.'),
  timeline([
    {
      year: '1948',
      title: 'Les studios perdent la main.',
      text: 'Pendant des années, les studios ont forcé les salles à prendre des courts liés à leurs longs métrages. En 1948, la Cour suprême a tranché contre les studios. Les accords qui ont suivi ont mis fin à la pratique et démantelé leurs chaînes de salles, et la télévision a emporté le public. Dans la décennie suivante, les studios ont fermé leurs unités de courts. La MGM a fermé son studio de dessins animés en 1957, et la Warner Bros. a laissé s’éteindre ses cartoons jusqu’à la fin des années 1960.',
    },
    {
      year: 'Les années 1950',
      title: 'Disney recule.',
      text: 'Dans la décennie qui suit 1953, Disney réduit ses courts pour les salles et reporte son poids sur les longs métrages et la télévision.',
    },
    {
      year: 'Aujourd’hui',
      title: 'Le paradoxe Pixar.',
      text: 'Pixar, le défenseur le plus connu des courts, s’en sert comme d’un laboratoire de talents. Ils passent avant les longs métrages et sont en grande partie payés par ce que ces longs rapportent.',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'Quibi a levé 1,75 milliard de dollars pour vendre des épisodes en bouchées de dix minutes, pour les gens en déplacement, derrière un abonnement, face à des applications gratuites comme TikTok. La société a fermé six mois après le lancement. Elle a parié sur le téléphone, pas sur les films.',
    },
  ]),
  p('Le streaming n’a pas réparé cela. Il l’a aggravé. Les fils réglés pour le temps d’écran ont peu de raisons de vous montrer un chef-d’œuvre de neuf minutes plutôt qu’une vidéo de quatre-vingt-dix minutes faite pour indigner.'),
  p('Pendant cent ans, le court a été une carte de visite, une expérience technique, ou une rampe vers le « vrai » cinéma, et rarement la destination. Même les meilleurs programmateurs en ligne servent surtout des cinéastes en route vers autre chose.'),
  h2('Ce qui manque'),
  p('Hollywood dépense 200 millions de dollars ou plus en suites de bandes dessinées. Les fils servent un flot sans fin, bâti pour retenir l’attention oisive. Le court métrage n’a pas de maison faite pour les histoires elles-mêmes, celles, décisives, qui ont façonné ce que signifie être humain.'),
  p('Imaginez un lieu construit pour le seul cinéma court. Des histoires avec la force des longs métrages, sans fils, sans algorithmes et sans bruit jetable. Les plus grandes histoires du monde en courts métrages, des rois déchus aux boxeurs, jusqu’à Prométhée volant le feu, avec l’échelle, l’exigence et la maison permanente qu’elles méritent.'),
  p('Le cinéma court n’a pas à concurrencer TikTok pour le temps mort du téléphone, à se glisser dans un modèle de billet des années 1950, ni à devenir une expérience technique. Il lui faut une maison.'),
  p('La thèse de Fjorr est simple : le format n’a pas échoué. Il a perdu sa maison.'),
  p('Fjorr traite les courts métrages comme l’événement principal, pas comme des amuse-bouches ou des gadgets. Il n’y a pas de péage ni de publicité. Fjorr est financé par ses mécènes, les Bureaux, et par des partenaires. Il construit une archive permanente de courts métrages de niveau mondial, toujours de 20 minutes ou moins, gratuite pour toute personne dans le monde.'),
  p('Le court n’a jamais été un compromis. Il avait seulement perdu sa maison, et maintenant il en a une.'),
];

const it: EssayBlock[] = [
  p('Il cortometraggio non ha avuto un modello di business che funzionasse da un secolo.'),
  p('È cominciato come l’evento principale. Il 28 dicembre 1895, i fratelli Lumière fecero pagare l’ingresso nel seminterrato di un caffè di Parigi e proiettarono dieci cortometraggi. Georges Méliès era in sala. Chiese di comprare la macchina e gli fu rifiutata. Sette anni dopo, sparò una capsula nell’occhio della Luna.'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès. L’uomo nella Luna con una capsula conficcata nell’occhio.',
    '*Le Voyage dans la Lune*, 1902. Diretto da Georges Méliès.'
  ),
  p('Poi presero il sopravvento i lungometraggi. Il corto divenne ciò che passava mentre la gente trovava posto: un numero di apertura, un riempitivo da cinegiornale, un extra nel menu di un DVD. Non fu una scelta artistica. Divenne l’intera identità del formato: gratis, attaccato a qualcos’altro, e mai la ragione per cui qualcuno si presentava.'),
  p('Il problema non è mai stato la mancanza di interesse. È stato il business intorno al formato.'),
  h2('Ogni tentativo di aggiustarlo si è rotto allo stesso modo'),
  p('Ognuno ha cercato di comprimere il cortometraggio in un biglietto, una pubblicità o un lungometraggio.'),
  timeline([
    {
      year: '1948',
      title: 'Gli studios perdono la presa.',
      text: 'Per anni, gli studios obbligarono le sale a prendere i corti in blocco con i lungometraggi. Nel 1948 la Corte Suprema si pronunciò contro gli studios. Gli accordi che seguirono posero fine alla pratica e smontarono le loro catene di sale, e la televisione portò via il pubblico. Nel decennio successivo, gli studios chiusero le unità dei corti. La MGM chiuse lo studio dei cartoon nel 1957, e la Warner Bros. lasciò spegnere i suoi cartoon fino alla fine degli anni Sessanta.',
    },
    {
      year: 'Gli anni Cinquanta',
      title: 'Disney fa un passo indietro.',
      text: 'Nel decennio dopo il 1953, Disney ridusse i corti per le sale e spostò il peso sui lungometraggi e sulla televisione.',
    },
    {
      year: 'Oggi',
      title: 'Il paradosso Pixar.',
      text: 'Pixar, il campione più noto dei corti, li usa come un laboratorio di talenti. Passano prima dei lungometraggi e sono pagati, in gran parte, da ciò che quei lungometraggi incassano.',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'Quibi raccolse 1,75 miliardi di dollari per vendere episodi in bocconi da dieci minuti, per chi è in movimento, dietro un abbonamento, contro app gratuite come TikTok. Chiuse sei mesi dopo il lancio. Scommise sul telefono, non sui film.',
    },
  ]),
  p('Lo streaming non ha risolto questo. L’ha peggiorato. I feed tarati sul tempo di schermo hanno poche ragioni per mostrarti un capolavoro di nove minuti invece di un video di novanta minuti fatto per indignare.'),
  p('Per cent’anni il corto è stato un biglietto da visita, un esperimento tecnico o una rampa verso il cinema “vero”, e raramente la destinazione. Anche i migliori curatori online servono soprattutto cineasti in viaggio verso qualcos’altro.'),
  h2('Quello che manca'),
  p('Hollywood spende 200 milioni di dollari o più in sequel di fumetti. I feed servono un flusso senza fine, costruito per trattenere l’attenzione oziosa. Il cortometraggio non ha una casa fatta per le storie stesse, quelle decisive che hanno dato forma a cosa significa essere umani.'),
  p('Immagina un luogo costruito solo per il cinema breve. Storie con la forza dei lungometraggi, senza feed, senza algoritmi e senza rumore usa e getta. Le più grandi storie del mondo come cortometraggi, dai re caduti ai pugili fino a Prometeo che ruba il fuoco, con la scala, lo standard e la casa permanente che meritano.'),
  p('Il cinema breve non deve competere con TikTok per il tempo morto del telefono, né infilarsi in un modello di biglietto degli anni Cinquanta, né diventare un esperimento tecnico. Ha bisogno di una casa.'),
  p('La tesi di Fjorr è semplice: il formato non è fallito. Ha perso la sua casa.'),
  p('Fjorr tratta i cortometraggi come l’evento principale, non come antipasti o trucchi. Non ci sono paywall né pubblicità. Fjorr è finanziato dai suoi patroni, i Bureaux, e dai partner. Sta costruendo un archivio permanente di cortometraggi di livello mondiale, sempre di 20 minuti o meno, gratis per chiunque nel mondo.'),
  p('Il breve non è mai stato un compromesso. Aveva solo perso la sua casa, e ora ne ha una.'),
];

const de: EssayBlock[] = [
  p('Der Kurzfilm hat seit einem Jahrhundert kein Geschäftsmodell, das funktioniert.'),
  p('Er begann als Hauptfilm. Am 28. Dezember 1895 nahmen die Brüder Lumière im Keller eines Pariser Cafés Eintritt und zeigten zehn Kurzfilme. Georges Méliès saß im Publikum. Er wollte den Apparat kaufen und wurde abgewiesen. Sieben Jahre später schoss er eine Kapsel ins Auge des Mondes.'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès. Der Mann im Mond mit einer Kapsel im Auge.',
    '*Le Voyage dans la Lune*, 1902. Regie: Georges Méliès.'
  ),
  p('Dann übernahmen die Langfilme. Der Kurzfilm wurde das, was lief, während die Leute ihre Plätze suchten: ein Vorprogramm, Füllstoff der Wochenschau, ein Extra im DVD-Menü. Das war keine künstlerische Entscheidung. Es wurde die ganze Identität des Formats: kostenlos, an etwas anderes gehängt, und nie der Grund, warum jemand kam.'),
  p('Das Problem war nie ein Mangel an Interesse. Es war das Geschäft um das Format.'),
  h2('Jeder Versuch, es zu richten, zerbrach auf dieselbe Weise'),
  p('Jeder versuchte, den Kurzfilm in eine Karte, eine Anzeige oder einen Langfilm zu pressen.'),
  timeline([
    {
      year: '1948',
      title: 'Die Studios verlieren den Zugriff.',
      text: 'Jahrelang zwangen die Studios die Kinos, Kurzfilme im Bündel mit ihren Langfilmen zu nehmen. 1948 entschied der Supreme Court gegen die Studios. Die Vergleiche, die folgten, beendeten die Praxis und zerschlugen ihre Kinoketten, und das Fernsehen zog das Publikum ab. Im folgenden Jahrzehnt schlossen die Studios ihre Kurzfilmabteilungen. MGM machte 1957 das Cartoon-Studio zu, und Warner Bros. ließ die Cartoons bis in die späten 1960er auslaufen.',
    },
    {
      year: 'Die 1950er',
      title: 'Disney tritt zurück.',
      text: 'Im Jahrzehnt nach 1953 fuhr Disney die Kurzfilme fürs Kino herunter und verlagerte das Gewicht auf Langfilme und Fernsehen.',
    },
    {
      year: 'Heute',
      title: 'Das Pixar-Paradox.',
      text: 'Pixar, der bekannteste Fürsprecher der Kurzfilme, nutzt sie als Talentlabor. Sie laufen vor den Langfilmen und werden zum großen Teil von dem bezahlt, was die Langfilme einspielen.',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'Quibi sammelte 1,75 Milliarden Dollar, um Folgen in Zehn-Minuten-Häppchen für Menschen unterwegs zu verkaufen, hinter einem Abo, gegen kostenlose Apps wie TikTok. Es stellte sechs Monate nach dem Start ein. Es setzte auf das Telefon, nicht auf die Filme.',
    },
  ]),
  p('Streaming hat das nicht behoben. Es hat es verschlimmert. Feeds, die auf Bildschirmzeit getrimmt sind, haben wenig Grund, dir ein neunminütiges Meisterwerk zu zeigen statt eines neunzigminütigen Videos, das Empörung sucht.'),
  p('Hundert Jahre lang war der Kurzfilm eine Visitenkarte, ein Technikexperiment oder ein Sprungbrett zum „echten“ Kino, und selten das Ziel. Selbst die besten Kuratoren im Netz bedienen vor allem Filmemacher auf dem Weg zu etwas anderem.'),
  h2('Was fehlt'),
  p('Hollywood gibt 200 Millionen Dollar oder mehr für Comic-Fortsetzungen aus. Feeds liefern einen endlosen Strom, gebaut, um müßige Aufmerksamkeit festzuhalten. Der Kurzfilm hat kein Haus, das für die Geschichten selbst gebaut ist, die entscheidenden, die geformt haben, was es heißt, ein Mensch zu sein.'),
  p('Stell dir einen Ort vor, der allein für das kurze Kino gebaut ist. Geschichten mit der Kraft von Langfilmen, ohne Feeds, ohne Algorithmen und ohne Wegwerfrauschen. Die größten Geschichten der Welt als Kurzfilme, von gestürzten Königen über Preisboxer bis zu Prometheus, der das Feuer stiehlt, mit dem Maßstab, dem Standard und dem dauerhaften Haus, das sie verdienen.'),
  p('Das kurze Kino muss nicht mit TikTok um müßige Zeit am Telefon konkurrieren, sich in ein Kartenmodell der 1950er zwängen oder ein Technikexperiment werden. Es braucht ein Haus.'),
  p('Fjorr hat eine einfache These: Das Format ist nicht gescheitert. Es hat sein Haus verloren.'),
  p('Fjorr behandelt Kurzfilme als Hauptfilm, nicht als Vorspeise oder Gag. Es gibt keine Bezahlschranken und keine Werbung. Fjorr wird von seinen Patronen finanziert, den Bureaux, und von Partnern. Es baut ein dauerhaftes Archiv von Kurzfilmen auf Weltniveau, immer 20 Minuten oder weniger, kostenlos für jeden Menschen auf der Welt.'),
  p('Kurz war nie ein Kompromiss. Es hatte nur sein Haus verloren, und jetzt hat es eins.'),
];

const pt: EssayBlock[] = [
  p('O curta-metragem não teve um modelo de negócio que funcionasse em um século.'),
  p('Começou como o evento principal. Em 28 de dezembro de 1895, os irmãos Lumière cobraram entrada no porão de um café de Paris e exibiram dez curtas. Georges Méliès estava na plateia. Pediu para comprar a máquina e foi recusado. Sete anos depois, disparou uma cápsula no olho da Lua.'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès. O homem na Lua com uma cápsula cravada no olho.',
    '*Le Voyage dans la Lune*, 1902. Dirigido por Georges Méliès.'
  ),
  p('Depois os longas tomaram o lugar. O curta passou a ser o que passava enquanto as pessoas achavam o assento: uma abertura, enchimento de cinejornal, um extra no menu de um DVD. Não foi uma escolha artística. Tornou-se a identidade inteira do formato: grátis, preso a outra coisa, e nunca a razão de alguém aparecer.'),
  p('O problema nunca foi falta de interesse. Foi o negócio em volta do formato.'),
  h2('Cada tentativa de consertar quebrou do mesmo jeito'),
  p('Cada uma tentou espremer o curta numa entrada, num anúncio ou num longa.'),
  timeline([
    {
      year: '1948',
      title: 'Os estúdios perdem o controle.',
      text: 'Por anos, os estúdios obrigaram os cinemas a aceitar curtas empacotados com seus longas. Em 1948 a Suprema Corte decidiu contra os estúdios. Os acordos que vieram depois acabaram com a prática e desmontaram suas redes de cinemas, e a televisão levou o público embora. Na década seguinte, os estúdios fecharam suas unidades de curtas. A MGM fechou o estúdio de desenhos em 1957, e a Warner Bros. foi encerrando seus cartoons até o fim dos anos 1960.',
    },
    {
      year: 'Os anos 1950',
      title: 'A Disney recua.',
      text: 'Na década depois de 1953, a Disney foi encerrando os curtas para o cinema e mudou o peso para os longas e a televisão.',
    },
    {
      year: 'Hoje',
      title: 'O paradoxo da Pixar.',
      text: 'A Pixar, a defensora mais conhecida dos curtas, usa-os como um laboratório de talento. Passam antes dos longas e são pagos, em grande parte, pelo que os longas arrecadam.',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'A Quibi levantou 1,75 bilhão de dólares para vender episódios em bocados de dez minutos para quem está em movimento, atrás de uma assinatura, contra apps grátis como o TikTok. Fechou seis meses depois do lançamento. Apostou no telefone, não nos filmes.',
    },
  ]),
  p('O streaming não consertou isso. Piorou. Feeds afinados para o tempo de tela têm pouca razão para te mostrar uma obra-prima de nove minutos no lugar de um vídeo de noventa minutos feito para indignar.'),
  p('Por cem anos, o curta foi um cartão de visitas, um experimento técnico ou uma rampa para o cinema “de verdade”, e raramente o destino. Até os melhores curadores online servem sobretudo cineastas a caminho de outra coisa.'),
  h2('O que falta'),
  p('Hollywood gasta 200 milhões de dólares ou mais em sequências de quadrinhos. Os feeds servem um fluxo sem fim, feito para segurar a atenção ociosa. O curta não tem uma casa feita para as histórias em si, as decisivas que deram forma ao que significa ser humano.'),
  p('Imagine um lugar feito só para o cinema curto. Histórias com a força dos longas, sem feeds, sem algoritmos e sem ruído descartável. As maiores histórias do mundo como curtas, de reis caídos a pugilistas e a Prometeu roubando o fogo, com a escala, o padrão e a casa permanente que merecem.'),
  p('O cinema curto não precisa competir com o TikTok pelo tempo ocioso do telefone, nem se espremer num modelo de ingresso dos anos 1950, nem virar um experimento técnico. Precisa de uma casa.'),
  p('A tese da Fjorr é simples: o formato não falhou. Perdeu a casa.'),
  p('A Fjorr trata os curtas como o evento principal, não como aperitivos ou truques. Não há paywall nem anúncios. A Fjorr é financiada pelos seus patronos, os Bureaux, e por parceiros. Está construindo um arquivo permanente de curtas de nível mundial, sempre de 20 minutos ou menos, grátis para qualquer pessoa no mundo.'),
  p('O curto nunca foi um meio-termo. Só perdeu a casa, e agora tem uma.'),
];

const sv: EssayBlock[] = [
  p('Kortfilmen har inte haft en affärsmodell som fungerat på ett sekel.'),
  p('Den började som huvudnumret. Den 28 december 1895 tog bröderna Lumière inträde i källaren på ett kafé i Paris och visade tio kortfilmer. Georges Méliès satt i publiken. Han bad att få köpa maskinen och fick nej. Sju år senare sköt han en kapsel i månens öga.'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès. Mannen i månen med en kapsel i ögat.',
    '*Le Voyage dans la Lune*, 1902. Regi: Georges Méliès.'
  ),
  p('Sedan tog långfilmerna över. Kortfilmen blev det som spelades medan folk hittade sina platser: ett förband, utfyllnad i en journalfilm, ett extra på en dvd-meny. Det var inte ett konstnärligt val. Det blev formatets hela identitet: gratis, fäst vid något annat, och aldrig skälet till att någon dök upp.'),
  p('Problemet var aldrig brist på intresse. Det var affären runt formatet.'),
  h2('Varje försök att laga det gick sönder på samma sätt'),
  p('Vart och ett försökte pressa in kortfilmen i en biljett, en annons eller en långfilm.'),
  timeline([
    {
      year: '1948',
      title: 'Studiorna tappar greppet.',
      text: 'I åratal tvingade studiorna biograferna att ta kortfilmer i paket med långfilmerna. 1948 dömde Högsta domstolen mot studiorna. Förlikningarna som följde avslutade praktiken och bröt upp deras biografkedjor, och televisionen drog bort publiken. Under det följande decenniet stängde studiorna sina kortfilmsavdelningar. MGM stängde sin tecknade studio 1957, och Warner Bros. lät sina tecknade filmer ebba ut in på sena 1960-talet.',
    },
    {
      year: '1950-talet',
      title: 'Disney backar.',
      text: 'Under decenniet efter 1953 trappade Disney ner sina kortfilmer för biograf och flyttade tyngden till långfilm och television.',
    },
    {
      year: 'I dag',
      title: 'Pixar-paradoxen.',
      text: 'Pixar, kortfilmens mest kända försvarare, använder dem som ett talanglabb. De spelas före långfilmerna och betalas till stor del av det långfilmerna drar in.',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'Quibi tog in 1,75 miljarder dollar för att sälja avsnitt i tiominutersbitar för folk på språng, bakom en prenumeration, mot gratisappar som TikTok. Det lades ner sex månader efter starten. Det satsade på telefonen, inte på filmerna.',
    },
  ]),
  p('Streaming lagade inte det här. Det gjorde det värre. Flöden stämda för skärmtid har liten anledning att visa dig ett niominuters mästerverk framför en nittiosminutersfilm byggd för upprördhet.'),
  p('I hundra år var kortfilmen ett visitkort, ett teknikexperiment eller en ramp mot ”riktig” film, och sällan målet. Även de bästa kuratorerna på nätet tjänar mest filmskapare på väg någon annanstans.'),
  h2('Det som saknas'),
  p('Hollywood lägger 200 miljoner dollar eller mer på seriealbumsuppföljare. Flöden serverar en ändlös ström, byggd för att hålla kvar sysslolös uppmärksamhet. Kortfilmen har inget hem byggt för berättelserna själva, de avgörande som format vad det betyder att vara människa.'),
  p('Föreställ dig en plats byggd bara för den korta filmen. Berättelser med långfilmens kraft, utan flöden, utan algoritmer och utan engångsbrus. Världens största berättelser som kortfilmer, från fallna kungar till prisboxare och Prometheus som stjäl elden, med den skala, den standard och det bestående hem de förtjänar.'),
  p('Den korta filmen behöver inte tävla med TikTok om sysslolös telefontid, trängas in i en biljettmodell från 1950-talet eller bli ett teknikexperiment. Den behöver ett hem.'),
  p('Fjorr har en enkel tes: formatet misslyckades inte. Det förlorade sitt hem.'),
  p('Fjorr behandlar kortfilmer som huvudnumret, inte som förrätter eller trick. Det finns inga betalväggar och ingen reklam. Fjorr finansieras av sina patroner, Bureaux, och av partner. Det bygger ett bestående arkiv av kortfilmer i världsklass, alltid 20 minuter eller mindre, gratis för vem som helst i världen.'),
  p('Kort var aldrig en kompromiss. Det hade bara förlorat sitt hem, och nu har det ett.'),
];

const hi: EssayBlock[] = [
  p('लघु फ़िल्म के पास एक सदी में कोई ऐसा कारोबारी मॉडल नहीं रहा जो चला हो।'),
  p('यह मुख्य कार्यक्रम के रूप में शुरू हुई। 28 दिसंबर 1895 को Lumière भाइयों ने पेरिस के एक कैफ़े के तलघर में टिकट लेकर दस लघु फ़िल्में दिखाईं। Georges Méliès दर्शकों में था। उसने मशीन खरीदने को कहा और मना कर दिया गया। सात साल बाद उसने चाँद की आँख में एक कैप्सूल दागा।'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès। चाँद पर आदमी, जिसकी आँख में एक कैप्सूल धँसा है।',
    '*Le Voyage dans la Lune*, 1902. निर्देशक Georges Méliès।'
  ),
  p('फिर फीचर फ़िल्में हावी हो गईं। लघु फ़िल्म वह बन गई जो लोग अपनी सीट ढूँढते समय चलती थी: एक ओपनिंग, न्यूज़रील की भराई, DVD मेनू पर एक अतिरिक्त। यह कलात्मक चुनाव नहीं था। यह प्रारूप की पूरी पहचान बन गई: मुफ़्त, किसी और चीज़ से जुड़ी, और कभी वह कारण नहीं जिसके लिए कोई आता।'),
  p('समस्या कभी रुचि की कमी नहीं थी। समस्या प्रारूप के आसपास का कारोबार थी।'),
  h2('इसे ठीक करने की हर कोशिश उसी तरह टूटी'),
  p('हर एक ने लघु फ़िल्म को टिकट, विज्ञापन या फीचर में ठूँसने की कोशिश की।'),
  timeline([
    {
      year: '1948',
      title: 'स्टूडियो अपनी पकड़ खो देते हैं।',
      text: 'सालों तक स्टूडियो सिनेमाघरों को अपनी फीचर के साथ बंडल की हुई लघु फ़िल्में लेने पर मजबूर करते रहे। 1948 में सुप्रीम कोर्ट ने स्टूडियो के खिलाफ़ फ़ैसला दिया। उसके बाद के समझौतों ने यह प्रथा खत्म की और उनकी सिनेमा शृंखलाएँ तोड़ दीं, और टेलीविज़न दर्शकों को ले गया। अगले दशक में स्टूडियो ने अपनी लघु इकाइयाँ बंद कर दीं। MGM ने 1957 में अपना कार्टून स्टूडियो बंद किया, और Warner Bros. ने अपने कार्टून 1960 के दशक के अंत तक समेट लिए।',
    },
    {
      year: '1950 का दशक',
      title: 'Disney पीछे हटता है।',
      text: '1953 के बाद के दशक में Disney ने अपनी थिएटर लघु फ़िल्में समेट लीं और अपना भार फीचर और टेलीविज़न पर ले गया।',
    },
    {
      year: 'आज',
      title: 'Pixar का विरोधाभास।',
      text: 'Pixar, लघु फ़िल्मों का सबसे जाना-माना समर्थक, उन्हें प्रतिभा की प्रयोगशाला की तरह इस्तेमाल करता है। वे फीचर से पहले चलती हैं और मोटे तौर पर उसी से चुकाई जाती हैं जो फीचर कमाते हैं।',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'Quibi ने चलते लोगों के लिए दस मिनट के टुकड़ों में एपिसोड बेचने को 1.75 अरब डॉलर जुटाए, एक सदस्यता के पीछे, TikTok जैसे मुफ़्त ऐप के सामने। लॉन्च के छह महीने बाद यह बंद हो गया। इसने फ़िल्मों पर नहीं, फ़ोन पर दाँव लगाया।',
    },
  ]),
  p('स्ट्रीमिंग ने इसे ठीक नहीं किया। इसे और बिगाड़ दिया। स्क्रीन-टाइम के लिए बने फ़ीड के पास नौ मिनट की उत्कृष्ट कृति दिखाने की बहुत कम वजह है, नब्बे मिनट के उस वीडियो के मुकाबले जो आक्रोश के लिए बना हो।'),
  p('सौ साल तक लघु फ़िल्म एक परिचय-पत्र, एक तकनीकी प्रयोग, या “असली” सिनेमा की सीढ़ी रही, और शायद ही कभी मंज़िल। सबसे अच्छे ऑनलाइन क्यूरेटर भी ज़्यादातर उन फ़िल्मकारों की सेवा करते हैं जो किसी और चीज़ की ओर जा रहे हैं।'),
  h2('जो नहीं है'),
  p('Hollywood कॉमिक की अगली कड़ियों पर 20 करोड़ डॉलर या उससे ज़्यादा खर्च करता है। फ़ीड खाली ध्यान को रोके रखने के लिए बनी एक अंतहीन धारा परोसते हैं। लघु फ़िल्म के पास उन कहानियों के लिए बना कोई घर नहीं है, उन निर्णायक कहानियों के लिए जिन्होंने यह आकार दिया कि इंसान होना क्या है।'),
  p('एक ऐसी जगह की कल्पना करें जो सिर्फ़ लघु सिनेमा के लिए बनी हो। फीचर फ़िल्मों जितनी ताकत वाली कहानियाँ, बिना फ़ीड, बिना एल्गोरिदम और बिना फेंके जाने वाले शोर के। दुनिया की सबसे बड़ी कहानियाँ लघु फ़िल्मों के रूप में, गिरे राजाओं से लेकर मुक्केबाज़ों तक, आग चुराते Prometheus तक, उस पैमाने, उस मानक और उस स्थायी घर के साथ जिसके वे हक़दार हैं।'),
  p('लघु सिनेमा को TikTok से फ़ोन के खाली समय के लिए मुकाबला नहीं करना, 1950 के दशक के टिकट मॉडल में नहीं घुसना, और तकनीकी प्रयोग नहीं बनना। उसे एक घर चाहिए।'),
  p('Fjorr की थीसिस सरल है: प्रारूप असफल नहीं हुआ। उसका घर छूट गया।'),
  p('Fjorr लघु फ़िल्मों को मुख्य कार्यक्रम मानता है, ऐपेटाइज़र या चाल नहीं। कोई पेवॉल नहीं और कोई विज्ञापन नहीं। Fjorr को उसके संरक्षक, Bureaux, और साझेदार धन देते हैं। यह विश्व-स्तर की लघु फ़िल्मों का एक स्थायी संग्रह बना रहा है, हमेशा 20 मिनट या उससे कम, दुनिया में किसी के भी देखने के लिए मुफ़्त।'),
  p('लघु कभी समझौता नहीं था। उसका बस घर छूट गया था, और अब एक है।'),
];

const ko: EssayBlock[] = [
  p('단편 영화는 한 세기 동안 작동하는 사업 모델을 갖지 못했다.'),
  p('그것은 본행사로 시작했다. 1895년 12월 28일, Lumière 형제는 파리의 한 카페 지하에서 입장료를 받고 단편 열 편을 상영했다. Georges Méliès가 객석에 있었다. 그는 그 기계를 사겠다고 했고 거절당했다. 7년 뒤, 그는 달의 눈에 캡슐을 쏘아 넣었다.'),
  figure(
    'Le Voyage dans la Lune (1902), Georges Méliès. 눈에 캡슐이 박힌 달의 남자.',
    '*Le Voyage dans la Lune*, 1902. 감독 Georges Méliès.'
  ),
  p('그다음 장편이 자리를 차지했다. 단편은 사람들이 자리를 찾는 동안 틀어 두는 것이 되었다. 오프닝, 뉴스 필름의 채움, DVD 메뉴의 보너스. 그것은 예술적 선택이 아니었다. 형식의 정체성 전체가 되었다. 무료이고, 다른 것에 붙어 있고, 누구도 그것 때문에 오지 않는.'),
  p('문제는 관심이 부족한 적이 없었다. 형식 주변의 사업이었다.'),
  h2('고치려는 시도는 모두 같은 방식으로 부러졌다'),
  p('각각은 단편을 티켓, 광고, 또는 장편 안에 밀어 넣으려 했다.'),
  timeline([
    {
      year: '1948',
      title: '스튜디오가 장악력을 잃다.',
      text: '여러 해 동안 스튜디오는 극장이 장편과 묶인 단편을 받도록 강요했다. 1948년 대법원은 스튜디오에 불리한 판결을 내렸다. 뒤이은 합의는 그 관행을 끝냈고 그들의 극장 체인을 해체했으며, 텔레비전은 관객을 데려갔다. 다음 10년 동안 스튜디오는 단편 부서를 닫았다. MGM은 1957년 만화 스튜디오를 닫았고, Warner Bros.는 1960년대 후반까지 만화를 접어 갔다.',
    },
    {
      year: '1950년대',
      title: 'Disney가 물러서다.',
      text: '1953년 이후의 10년 동안 Disney는 극장용 단편을 줄이고 무게를 장편과 텔레비전으로 옮겼다.',
    },
    {
      year: '오늘',
      title: 'Pixar의 역설.',
      text: '단편의 가장 잘 알려진 옹호자인 Pixar는 단편을 인재 실험실로 쓴다. 장편 전에 상영되고, 대개 장편이 벌어들이는 것으로 비용을 댄다.',
    },
    {
      year: '2020',
      title: 'Quibi.',
      text: 'Quibi는 이동 중인 사람들을 위해 10분 분량으로 에피소드를 팔려고 17억 5천만 달러를 모았다. 구독 뒤에 두고, TikTok 같은 무료 앱과 맞섰다. 출시 6개월 만에 문을 닫았다. 영화가 아니라 전화기에 걸었다.',
    },
  ]),
  p('스트리밍은 이것을 고치지 못했다. 더 나쁘게 만들었다. 화면 시간에 맞춘 피드는 90분의 분노 영상보다 9분의 걸작을 보여줄 이유가 거의 없다.'),
  p('백 년 동안 단편은 명함, 기술 실험, 또는 “진짜” 영화로 가는 발판이었고, 목적지인 경우는 드물었다. 가장 뛰어난 온라인 큐레이터조차 대개 다른 곳으로 가는 중인 영화인을 섬긴다.'),
  h2('없는 것'),
  p('Hollywood는 만화 속편에 2억 달러 이상을 쓴다. 피드는 빈 주의를 붙들도록 만든 끝없는 흐름을 내놓는다. 단편에는 이야기 자체를 위해 지은 집이 없다. 사람이라는 것의 의미를 만든 그 결정적인 이야기들을 위해.'),
  p('단편 영화만을 위해 지은 곳을 상상해 보라. 장편의 힘을 가진 이야기, 피드도 알고리즘도 버리고 마는 소음도 없이. 세계의 가장 큰 이야기가 단편으로, 쓰러진 왕에서 프라이즈파이터까지, 불을 훔친 Prometheus까지, 그들이 마땅히 가질 규모와 기준과 영구적인 집과 함께.'),
  p('단편 영화는 빈 전화 시간을 두고 TikTok과 겨룰 필요도, 1950년대 티켓 모델에 끼어들 필요도, 기술 실험이 될 필요도 없다. 집이 필요하다.'),
  p('Fjorr의 명제는 단순하다. 형식이 실패한 것이 아니다. 집을 잃었다.'),
  p('Fjorr는 단편을 애피타이저나 장치가 아니라 본행사로 대한다. 유료 장벽도 광고도 없다. Fjorr는 후원자인 Bureaux와 파트너가 자금을 댄다. 세계 수준의 단편을 모은 영구 아카이브를 짓고 있다. 언제나 20분 이하, 세상 누구나 무료로 본다.'),
  p('짧음은 한 번도 타협이 아니었다. 집을 잃었을 뿐이고, 이제 집이 있다.'),
];

const ja: EssayBlock[] = [
  p('短編映画は、一世紀のあいだ、機能する事業モデルを持たなかった。'),
  p('それは本編として始まった。1895年12月28日、Lumière兄弟はパリのカフェの地下室で入場料を取り、短編を十本上映した。客席にGeorges Mélièsがいた。彼はその機械を買いたいと頼み、断られた。七年後、彼は月の目にカプセルを撃ち込んだ。'),
  figure(
    'Le Voyage dans la Lune（1902）、Georges Méliès。目にカプセルの刺さった月の男。',
    '*Le Voyage dans la Lune*、1902。監督 Georges Méliès。'
  ),
  p('それから長編が席を取った。短編は、人が席を探すあいだに流れるものになった。前座、ニュース映画の埋め草、DVDメニューのおまけ。それは芸術上の選択ではなかった。形式の正体そのものになった。無料で、何か別のものに付いていて、誰もそれのために来ない。'),
  p('問題は、関心が足りなかったことではなかった。形式の周りの事業だった。'),
  h2('直そうとする試みは、どれも同じ壊れ方をした'),
  p('それぞれが、短編をチケットか、広告か、長編のなかに押し込めようとした。'),
  timeline([
    {
      year: '1948',
      title: 'スタジオが支配を失う。',
      text: '長年、スタジオは劇場に、長編と束ねた短編を取らせた。1948年、最高裁はスタジオに不利な判決を下した。その後の和解はその慣行を終わらせ、彼らの劇場チェーンを解体し、テレビは観客を連れ去った。次の十年、スタジオは短編部門を閉じた。MGMは1957年に漫画スタジオを閉め、Warner Bros.は1960年代末まで漫画を畳んでいった。',
    },
    {
      year: '1950年代',
      title: 'Disneyが退く。',
      text: '1953年からの十年、Disneyは劇場用短編を縮小し、重心を長編とテレビへ移した。',
    },
    {
      year: '今日',
      title: 'Pixarの逆説。',
      text: '短編の最も知られた擁護者であるPixarは、短編を才能の実験室として使う。長編の前にかかり、その費用の多くは長編が稼ぐものから出る。',
    },
    {
      year: '2020',
      title: 'Quibi。',
      text: 'Quibiは、移動中の人に十分間の断片でエピソードを売るため、17億5千万ドルを集めた。サブスクリプションの向こうで、TikTokのような無料アプリと向き合った。公開から六か月で閉じた。賭けたのは映画ではなく、電話だった。',
    },
  ]),
  p('ストリーミングはこれを直さなかった。悪化させた。画面時間に合わせたフィードには、九十分の怒りを誘う動画より、九分の傑作を見せる理由がほとんどない。'),
  p('百年のあいだ、短編は名刺であり、技術の実験であり、「本物」の映画への踏み台であり、目的地であることはめったになかった。最も優れたオンラインのキュレーターでさえ、ほとんどは別の場所へ向かう途中の映画作家に仕えている。'),
  h2('欠けているもの'),
  p('Hollywoodは漫画の続編に2億ドル以上を使う。フィードは、空いた注意を引き留めるために組まれた終わりのない流れを出す。短編には、物語そのもののための家がない。人であることの意味を形づくった、あの決定的な物語のための家が。'),
  p('短い映画のためだけに建てられた場所を想像してほしい。長編の力を持つ物語。フィードもなく、アルゴリズムもなく、捨てるための雑音もない。世界でいちばん大きな物語が、短編としてある。落ちた王から拳闘士まで、火を盗むPrometheusまで。彼らにふさわしい規模と基準と、恒久の家とともに。'),
  p('短い映画は、空いた電話の時間をめぐってTikTokと争う必要もない。1950年代のチケットの型に押し込む必要もない。技術の実験になる必要もない。必要なのは家だ。'),
  p('Fjorrの命題は単純だ。失敗したのは形式ではない。家を失った。'),
  p('Fjorrは短編を前菜や仕掛けではなく、本番として扱う。有料の壁もなく、広告もない。Fjorrを支えるのはパトロンであるBureauxと、パートナーだ。世界水準の短編を集めた恒久のアーカイブを建てている。いつも20分以内。世界の誰でも、無料で見られる。'),
  p('短さは、一度も妥協ではなかった。家を失っていただけで、今はある。'),
];

const zhTw: EssayBlock[] = [
  p('短片一個世紀以來，沒有過一個真的運作的商業模式。'),
  p('它一開始就是主場。1895 年 12 月 28 日，Lumière 兄弟在巴黎一間咖啡館的地下室收門票，放了十部短片。Georges Méliès 坐在觀眾裡。他想買那台機器，被拒絕了。七年後，他把一枚艙體射進月亮的眼睛。'),
  figure(
    'Le Voyage dans la Lune（1902），Georges Méliès。月亮上的人，眼睛裡嵌著一枚艙體。',
    '*Le Voyage dans la Lune*，1902。導演 Georges Méliès。'
  ),
  p('然後長片接手了。短片變成人們找座位時播的東西：暖場、新聞片的填充、DVD 選單上的花絮。那不是藝術選擇。它成了這個形式全部的身份：免費、附在別的東西上、從來不是任何人出現的理由。'),
  p('問題從來不是缺少興趣。是圍著這個形式的生意。'),
  h2('每一次想修好它，都用同一種方式壞掉'),
  p('每一次都想把短片塞進一張票、一支廣告，或是一部長片。'),
  timeline([
    {
      year: '1948',
      title: '片廠失去掌握。',
      text: '多年來，片廠強迫戲院收下和長片捆在一起的短片。1948 年，最高法院判片廠敗訴。隨後的和解結束了這套做法，也拆散了他們的戲院連鎖，電視把觀眾帶走。接下來十年，片廠關掉短片單位。MGM 在 1957 年關閉卡通工作室，Warner Bros. 把卡通一路收到 1960 年代末。',
    },
    {
      year: '1950 年代',
      title: 'Disney 退後。',
      text: '1953 年之後的十年，Disney 收起劇院短片，把重心移到長片和電視。',
    },
    {
      year: '今天',
      title: 'Pixar 的悖論。',
      text: 'Pixar 是短片最有名的擁護者，卻把短片當成人才實驗室。它們在長片之前放映，費用大半由長片賺到的錢支付。',
    },
    {
      year: '2020',
      title: 'Quibi。',
      text: 'Quibi 募了 17.5 億美元，要把十分鐘一段的集數賣給在路上的人，放在訂閱後面，對著 TikTok 這類免費應用。上線六個月就關了。它押的是手機，不是電影。',
    },
  ]),
  p('串流沒有修好這件事。它把它弄得更糟。為螢幕時間調校的動態，沒什麼理由讓你看到九分鐘的傑作，而不是九十分鐘、用來激怒人的影片。'),
  p('一百年來，短片是名片、科技實驗，或是通往「真正」電影的跳板，很少是目的地。就算最出色的線上策展人，大多也是在服務正要去別處的電影人。'),
  h2('缺少的是什麼'),
  p('Hollywood 在漫畫續集上花兩億美元或更多。動態端出一條沒有盡頭的流，為了留住空閒的注意力。短片沒有一座為故事本身而建的家，那些塑造了「身為人」的、關鍵的故事。'),
  p('想像一個只為短片電影而建的地方。和長片一樣有力的故事，沒有動態、沒有演算法、沒有用過即丟的噪音。世界上最偉大的故事，作為短片，從隕落的國王到拳擊手，到偷火的 Prometheus，配上它們應得的規模、標準，和永久的家。'),
  p('短片電影不必和 TikTok 爭手機上的空閒時間，不必擠進 1950 年代的戲票模型，也不必變成科技實驗。它需要一座家。'),
  p('Fjorr 的命題很簡單：失敗的不是形式。它失去了家。'),
  p('Fjorr 把短片當成主場，不是開胃菜，也不是噱頭。沒有付費牆，也沒有廣告。Fjorr 由它的資助者 Bureaux，以及夥伴出資。它正在建造一座永久的檔案，收世界級短片，永遠 20 分鐘以內，世界上任何人都免費可看。'),
  p('短，從來不是妥協。它只是失去了家，現在有一座。'),
];

export const ESSAY_FAILURE_LOCALES: Partial<Record<AppLocale, EssayBlock[]>> = {
  es,
  fr,
  it,
  de,
  pt,
  sv,
  hi,
  ko,
  ja,
  'zh-tw': zhTw,
};
