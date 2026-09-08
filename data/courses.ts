import type { Course,Exercise,Lesson,World } from "@/lib/types";
const h=(topic:string):[string,string,string]=>[`Identifica qué sabes sobre ${topic}.`,`Descarta las opciones que contradicen el concepto.`,`Revisa el ejemplo de la lección y aplica el mismo proceso.`];
const lesson=(prefix:string,n:number,title:string,summary:string,concept:string,example:string,skill:string,answer:string,wrong:string[]):Lesson=>({id:`${prefix}-${n}`,title,summary,concept,example,skill,xp:50,exercises:[
{id:`${prefix}-${n}-a`,type:"choice",prompt:`Comprueba tu idea: ${summary}`,options:[answer,...wrong].sort((a,b)=>a.localeCompare(b)),answer,hints:h(skill),explanation:`La respuesta es “${answer}” porque ${concept.toLowerCase()}`,difficulty:Math.min(5,1+Math.floor(n/5)) as 1|2|3|4|5},
{id:`${prefix}-${n}-b`,type:"true-false",prompt:`Verdadero o falso: ${example}`,options:["Verdadero","Falso"],answer:"Verdadero",hints:h(skill),explanation:`Es verdadero. ${concept}`,difficulty:Math.min(5,1+Math.floor(n/6)) as 1|2|3|4|5},
{id:`${prefix}-${n}-c`,type:"fill",prompt:`Completa la idea clave: ${title} nos ayuda a comprender _____.`,answer:skill,options:[skill,"azar","memoria"],hints:h(skill),explanation:`La habilidad central es ${skill}.`,difficulty:2}
]});
const makeWorlds=(prefix:string,defs:string[][]):World[]=>defs.map((d,i)=>({id:`${prefix}-w${i+1}`,title:d[0],description:d[1],icon:d[2],lessons:d.slice(3).map((raw,j)=>{const [t,s,c,e,k,a,...w]=raw.split("|");return lesson(prefix,i*10+j+1,t,s,c,e,k,a,w)})}));
const math=makeWorlds("math",[
["Fundamentos numéricos","Construye agilidad y estrategias, no memorización vacía.","∑",
"Sentido numérico|Elige la representación de ocho|Una cantidad puede representarse con símbolos, objetos o palabras.|8 representa ocho objetos.|representación numérica|8|80|6",
"Comparar cantidades|¿Qué símbolo indica que 12 es mayor que 9?|Comparar significa decidir cuál cantidad es mayor, menor o igual.|12 > 9.|comparación|>|<|=",
"Suma estratégica|¿Cómo calculas 28 + 7 mentalmente?|Completar una decena reduce la carga mental.|28 + 2 + 5 = 35.|suma mental|Completar 30 y sumar 5|Restar 7|Multiplicar",
"Resta con sentido|Para 52 − 19, elige una estrategia eficiente|Compensar permite restar un número amigable y corregir.|52 − 20 + 1 = 33.|resta mental|Restar 20 y sumar 1|Sumar 19|Duplicar 52",
"Patrones|Continúa 3, 6, 12, 24…|Un patrón tiene una regla consistente entre términos.|Cada término se duplica; sigue 48.|patrones|48|27|30",
"Cálculo mental|Calcula 25 × 4 usando agrupación|Cuatro grupos de 25 forman una centena.|25 + 25 + 25 + 25 = 100.|cálculo mental|100|80|125"],
["Multiplicación y división","Relaciona grupos, reparto y problemas reales.","×",
"Grupos iguales|¿Qué expresa 4 × 6?|Multiplicar representa grupos iguales.|4 grupos de 6 son 24.|multiplicación|24|10|46",
"Propiedad distributiva|Descompón 7 × 8|La distributiva separa un factor en partes cómodas.|7 × (5 + 3) = 35 + 21.|estrategias multiplicativas|56|54|64",
"División exacta|Reparte 36 en 4 grupos iguales|Dividir puede ser repartir equitativamente.|36 ÷ 4 = 9.|división|9|8|12",
"Resto|¿Qué queda al repartir 17 objetos entre 5?|El resto es lo que no completa otro grupo.|17 = 5 × 3 + 2.|división con resto|2|3|5",
"Problemas verbales|6 cajas tienen 8 libros cada una. ¿Total?|Identifica grupos y cantidad por grupo.|6 × 8 = 48 libros.|modelado|48|14|42"],
["Fracciones y decimales","Representa partes, equivalencias y operaciones.","½",
"Parte de un todo|¿Qué significa 3/4?|El numerador cuenta partes y el denominador divide el todo.|Tres de cuatro partes iguales son 3/4.|fracciones|3 de 4 partes|4 de 3 partes|3 enteros",
"Equivalencias|Encuentra una fracción equivalente a 1/2|Multiplicar numerador y denominador por el mismo número conserva el valor.|1/2 = 2/4.|equivalencia|2/4|2/3|1/4",
"Comparar fracciones|¿Cuál es mayor, 2/3 o 3/5?|Un denominador común permite comparar con justicia.|10/15 > 9/15.|comparación de fracciones|2/3|3/5|iguales",
"Sumar fracciones|Calcula 1/4 + 2/4|Con denominadores iguales, se suman numeradores.|1/4 + 2/4 = 3/4.|suma de fracciones|3/4|3/8|2/4",
"Decimales|¿Qué fracción decimal representa 0.75?|Las centésimas conectan decimales y fracciones.|0.75 = 75/100 = 3/4.|decimales|3/4|7/5|1/4"],
["Álgebra y datos","Generaliza relaciones y razona con evidencia.","ƒ",
"Porcentajes|¿Cuánto es 20% de 50?|Un porcentaje es una cantidad por cada cien.|0.20 × 50 = 10.|porcentajes|10|20|25",
"Variables|Si x + 7 = 12, ¿cuánto vale x?|Una variable representa un valor aún desconocido.|Restar 7 a ambos lados da x = 5.|ecuaciones|5|7|19",
"Coordenadas|¿Cómo se escribe el punto x=3, y=2?|Un punto se nombra como par ordenado (x, y).|(3, 2) avanza 3 y sube 2.|plano cartesiano|(3, 2)|(2, 3)|3 + 2",
"Media|Calcula la media de 2, 4 y 6|La media reparte el total equitativamente.|(2 + 4 + 6) ÷ 3 = 4.|estadística|4|3|6"]]);
const english=makeWorlds("english",[
["First connections","Understand and create useful everyday English.","A",
"Greetings|Choose a natural morning greeting|Greetings change with context and time.|Good morning is natural before noon.|greetings|Good morning|Good night|Goodbye",
"Family|Who is your mother's brother?|Family words describe relationships precisely.|Your mother's brother is your uncle.|family vocabulary|uncle|cousin|brother",
"Animals|Choose the animal that can fly|Verbs describe what animals can do.|A bird can fly.|animal vocabulary|bird|fish|turtle",
"Colors|Mix blue and yellow|Color words help describe objects.|Blue and yellow make green.|colors|green|purple|orange",
"Numbers|Write 14 in English|English number spelling follows patterns.|14 is spelled fourteen.|numbers|fourteen|forty|four"] ,
["Everyday explorer","Use complete sentences in familiar situations.","◎",
"Food|Choose a polite request|Polite requests often use “Could I have…?”|Could I have an apple, please?|polite language|Could I have an apple, please?|Give apple.|I apple want.",
"School|Complete: She ___ a book every day.|Third-person present verbs usually add s.|She reads a book every day.|present simple|reads|read|reading",
"Home|Where do you usually cook?|Rooms have functions.|We usually cook in the kitchen.|home vocabulary|kitchen|bedroom|garden",
"Daily routines|Put the routine in a natural sentence|English normally uses subject + verb + detail.|I brush my teeth after breakfast.|sentence order|I brush my teeth after breakfast.|Brush I teeth.|My teeth breakfast.",
"Emotions|How might someone feel after solving a challenge?|Emotion words let us express internal states.|I feel proud after persistent work.|emotions|proud|hungry|square"] ,
["Ideas and stories","Read, reason and communicate with richer language.","✦",
"Past tense|Complete: Yesterday, we ___ to the museum.|Past events require a past-tense verb.|The past of go is went.|past tense|went|go|gone",
"Future plans|Choose a clear future plan|“Going to” expresses an intention.|I am going to study science tomorrow.|future forms|I am going to study science tomorrow.|I yesterday science.|Tomorrow studied I.",
"Reading clues|Mia carried an umbrella. What might the weather be?|Readers infer using evidence in the text.|An umbrella is evidence that rain is possible.|inference|It may be raining.|It is certainly sunny.|It is midnight.",
"Academic English|Which phrase introduces evidence?|Academic writing connects claims and support.|“For example” introduces supporting evidence.|academic connectors|For example|Once upon a time|Hey!",
"Writing clearly|Choose the strongest sentence|Clear writing uses specific verbs and details.|The bright comet streaked across the dark sky.|descriptive writing|The bright comet streaked across the dark sky.|It was nice.|Thing moved."]]);
const finance=makeWorlds("finance",[["Money foundations","Make thoughtful choices with limited resources.","$",
"What is money?|Which is a useful role of money?|Money helps people exchange value and compare prices.|A coin can be exchanged for a product.|money|medium of exchange|guaranteed happiness|unlimited resource",
"Income|What is income?|Income is money received from work, allowance, gifts or assets.|Earning S/20 for a task is income.|income|money received|every purchase|money lost",
"Expenses|Which is an expense?|An expense is money spent on goods or services.|Paying S/5 for transport is an expense.|expenses|money spent|money earned|money saved",
"Saving|You have S/100 and save S/20 monthly. After 3 months?|Saving sets money aside for a future goal.|S/100 + 3 × S/20 = S/160.|saving|S/160|S/120|S/60",
"Budget|What does a budget do?|A budget is a plan for income, spending and saving.|Plan S/50: needs 25, save 15, wants 10.|budgeting|plans money|creates money|removes choices"] ,
["Smart growth","Understand compounding, risk and investing.","↗",
"Needs and wants|Which is usually a need?|Needs support basic wellbeing; wants add comfort or fun.|Clean water is a need.|decision making|clean water|new game skin|third backpack",
"Simple interest|What produces interest?|Interest is a cost of borrowing or reward for lending/saving.|5% of S/100 is S/5.|interest|principal and rate|color of money|day of week",
"Compound interest|Why can compound growth accelerate?|Compound interest earns returns on prior returns.|Year two can earn on the original S/100 plus year-one interest.|compounding|returns earn returns|rates disappear|money doubles daily",
"Inflation|What can inflation change?|Inflation means general prices rise over time, reducing purchasing power.|If a snack rises from S/2 to S/2.20, the same money buys less.|inflation|purchasing power|coin size|bank password",
"Diversification|Why spread an investment?|Diversification reduces dependence on one outcome, but cannot remove all risk.|Three different baskets are safer than one fragile basket.|diversification|manage concentration risk|guarantee profit|avoid learning"]]);
const trading=makeWorlds("trading",[
["Markets without myths","Learn how prices form—never with real money.","⌁",
"A market|What happens in a market?|A market connects willing buyers and sellers.|A school fair is a small market.|market mechanics|buyers and sellers exchange|prices only rise|everyone wins",
"Supply and demand|What may happen when demand rises and supply stays fixed?|More competition among buyers can raise price, though markets remain uncertain.|Ten buyers competing for two items may bid more.|supply and demand|price may rise|price must fall|risk disappears",
"Stocks|What does a stock represent?|A stock is a small ownership share in a company, with risk.|Owning a share does not guarantee profit.|assets|partial ownership|a loan from a friend|guaranteed income",
"Currencies|What is a currency pair?|A pair compares the relative value of two currencies.|EUR/USD compares euros with US dollars.|forex basics|relative currency value|two company shares|free money",
"Bid, ask, spread|What is the spread?|The spread is the difference between quoted buy and sell prices.|Ask 101 − bid 100 = spread 1.|market costs|ask minus bid|profit target|account balance"] ,
["Read the chart","Treat charts as evidence, not prophecy.","⌇",
"Candles|What can one candle summarize?|A candle summarizes open, high, low and close for a period.|A daily candle compresses one day's movement.|candlesticks|OHLC prices|future certainty|company quality",
"Timeframes|Why compare timeframes?|Different timeframes reveal different levels of detail.|A 5-minute chart may look noisy inside a daily trend.|timeframes|context|guaranteed entry|remove volatility",
"Trend|What describes an uptrend?|Higher highs and higher lows often characterize an uptrend until structure changes.|Rising swing points show direction, not certainty.|trend|higher highs and lows|one green candle|flat price",
"Support and resistance|What are support and resistance?|They are zones where price previously reacted, not unbreakable walls.|Price may pass through a prior support zone.|price zones|areas of prior reaction|guarantees|broker rules",
"Volatility|What does high volatility mean?|Volatility describes the size and speed of price changes.|Wide rapid swings mean greater uncertainty and risk.|volatility|larger price movement|certain profit|no spread"] ,
["Risk-first simulator","A good process matters more than one outcome.","◈",
"Stop loss|Why define a stop before a simulated trade?|A stop defines where the idea is invalid and limits planned loss.|At 1% risk on $10,000, maximum planned loss is $100.|risk control|limit planned loss|guarantee a win|increase leverage",
"Take profit|What is a take-profit level?|It is a planned exit if price reaches a favorable level.|An exit plan reduces impulsive decisions.|trade planning|planned favorable exit|loan size|market order only",
"Risk-reward|Entry 100, stop 98, target 106: reward-to-risk?|Risk is 2 and potential reward is 6, so R:R is 3.|6 ÷ 2 = 3.|risk reward|3|2|8",
"Position size|What should determine position size?|Position size follows account risk and stop distance, not excitement.|$100 risk divided by $2 stop distance gives 50 units.|position sizing|risk budget and stop distance|emotion|desired profit",
"Trading journal|Why record a trade?|A journal makes decisions reviewable and separates process from luck.|A managed loss can reveal excellent discipline.|reflection|learn from process|hide losses|predict perfectly"]]);
export const courses:Course[]=[{slug:"matematicas",title:"Matemáticas",subtitle:"Del sentido numérico al pensamiento avanzado",color:"violet",worlds:math},{slug:"english",title:"English",subtitle:"Real communication, one idea at a time",color:"cyan",worlds:english},{slug:"finanzas",title:"Finanzas",subtitle:"Decisiones inteligentes para la vida",color:"amber",worlds:finance},{slug:"trading",title:"Trading Lab",subtitle:"Simulación, riesgo y disciplina",color:"emerald",worlds:trading}];
export const allLessons=courses.flatMap(c=>c.worlds.flatMap(w=>w.lessons.map(l=>({...l,course:c.slug,world:w.title}))));
export function getLesson(id:string){return allLessons.find(l=>l.id===id)}
export function getCourse(slug:string){return courses.find(c=>c.slug===slug)}
