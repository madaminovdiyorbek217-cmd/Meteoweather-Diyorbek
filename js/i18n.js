'use strict';
/* Языки: русский и узбекский (латиница). Тексты, названия дней и месяцев, форматирование дат.
   Чтобы добавить язык, скопируйте блок `ru` или `uz`, переведите и добавьте код языка в LANGS. */

const LANGS = ['ru', 'uz'];
let LANG = 'ru';

const I18N = {
  ru: {
    title: 'Погода Узбекистана', brand: 'Погода Узбекистана',
    maker: 'Создатель сайта', makerName: 'Диёрбек Мадаминов', makerTitle: 'Открыть Telegram @madaminovv712',
    region: 'Регион', regionsList: 'Регионы Узбекистана', allRegions: 'Все регионы', favorites: 'Избранное',
    addFav: 'Добавить в избранное', removeFav: 'Убрать из избранного', favAdded: '{name}: добавлено в избранное', favRemoved: '{name}: убрано из избранного',
    locate: 'Показать ближайший регион', locOk: 'Ближайший регион: {name}', locFar: 'Вы далеко от Узбекистана. Ближайший регион: {name}',
    locDenied: 'Нет доступа к геопозиции. Разрешите её в настройках браузера', locFail: 'Определить местоположение не удалось',
    settings: 'Настройки', language: 'Язык', theme: 'Тема', dark: 'Тёмная', light: 'Светлая',
    temperature: 'Температура', windSet: 'Ветер', pressureSet: 'Давление',
    ms: 'м/с', kmh: 'км/ч', mmhg: 'мм рт. ст.', hpa: 'гПа', mm: 'мм',
    install: 'Установить как приложение', installDone: 'Приложение установлено',
    now: 'Сейчас', back: 'К текущей погоде', today: 'Сегодня', tomorrow: 'Завтра', dayAfter: 'Послезавтра',
    feels: 'Ощущается как {t}', todayRange: 'Сегодня от {a} до {b}', dayRange: 'Днём до {a}, ночью {b}', dayFeels: 'Ощущается днём как {t}',
    humidity: 'Влажность', windFact: 'Ветер', pressureFact: 'Давление', precipToday: 'Осадки сегодня', sunrise: 'Восход', sunset: 'Закат',
    windUpTo: 'Ветер до', precip: 'Осадки', popProb: 'Вероятность осадков', uv: 'УФ-индекс',
    hourlyTitle: 'Почасовой прогноз', next24: 'Ближайшие 24 часа', day24: '{day}, по часам', hourlyHint: 'Прокрутите вбок, чтобы увидеть все часы',
    hourNow: 'Сейчас', rainProb: 'Вероятность осадков', temperatureLine: 'Температура',
    weekTitle: 'Прогноз на 15 дней', weekHint: '{name}. Нажмите на день, чтобы увидеть погоду на этот день.',
    airTitle: 'Качество воздуха', aqiLabel: 'Индекс AQI (США)', maxDay: 'Максимум за день', noAir: 'Нет данных о качестве воздуха', airFar: 'Прогноз качества воздуха доступен на 5 дней вперёд',
    pm25: 'PM2.5', pm10: 'PM10', o3: 'Озон', no2: 'NO₂',
    cat_good: 'Хороший', cat_moderate: 'Умеренный', cat_sensitive: 'Вреден для чувствительных', cat_unhealthy: 'Вредный', cat_veryUnhealthy: 'Очень вредный', cat_hazardous: 'Опасный',
    adv_good: 'Воздух чистый. Хорошее время для прогулок.',
    adv_moderate: 'Воздух приемлемый. Очень чувствительным людям лучше не гулять подолгу.',
    adv_sensitive: 'Людям с астмой и болезнями сердца, а также детям лучше меньше быть на улице.',
    adv_unhealthy: 'Не занимайтесь спортом на улице, при необходимости наденьте маску.',
    adv_veryUnhealthy: 'Оставайтесь дома и закройте окна.',
    adv_hazardous: 'Опасный уровень. Не выходите на улицу.',
    tipsTitle: 'Советы', outfit: 'Что надеть', moon: 'Луна', farm: 'Для садоводов и фермеров',
    o_winter: 'Тёплая зимняя куртка, шапка, шарф и перчатки', o_cold: 'Зимняя куртка, шапка и перчатки', o_cool: 'Тёплое пальто или куртка, шарф',
    o_mild: 'Лёгкая куртка или свитер', o_warm: 'Футболка, на вечер лёгкая кофта', o_hot: 'Лёгкая одежда и головной убор',
    o_veryHot: 'Свободная светлая одежда, головной убор и вода с собой', o_extreme: 'Днём не выходите на солнце: светлая одежда и много воды',
    o_rain: 'Зонт или дождевик', o_snow: 'Непромокаемая обувь', o_sun: 'Солнцезащитные очки и крем', o_wind: 'Ветровка или одежда с капюшоном',
    o_range: 'Вечером заметно холоднее: возьмите кофту',
    ph0: 'Новолуние', ph1: 'Растущий серп', ph2: 'Первая четверть', ph3: 'Растущая Луна', ph4: 'Полнолуние', ph5: 'Убывающая Луна', ph6: 'Последняя четверть', ph7: 'Убывающий серп',
    illum: 'Освещено {n}%', nextFull: 'Полнолуние через {n} дн.', nextNew: 'Новолуние через {n} дн.',
    rain7: 'Осадки за 7 дней', frost: 'Заморозки', noFrost: 'Не ожидаются', frostOn: 'Возможны: {days}', water: 'Полив',
    waterDryHot: 'Сухо и жарко: полив не помешает', waterDry: 'Осадков мало: следите за влажностью почвы', waterOk: 'Осадков достаточно', waterWet: 'Много осадков: полив не нужен',
    al_heat: 'Жара', al_heat_t: 'Днём до {t}. Пейте больше воды, носите головной убор.',
    al_extremeHeat: 'Сильная жара', al_extremeHeat_t: 'Днём до {t}. Не выходите на солнце с 11 до 17 часов.',
    al_frost: 'Заморозки', al_frost_t: 'Ночью {t}. Возможен гололёд, укройте растения.',
    al_severeFrost: 'Сильный мороз', al_severeFrost_t: 'Ночью {t}. Одевайтесь как можно теплее.',
    al_wind: 'Сильный ветер', al_wind_t: 'Порывы до {w}.',
    al_storm: 'Гроза', al_storm_t: 'Возможны молнии и шквалистый ветер.',
    al_hail: 'Гроза с градом', al_hail_t: 'Град может повредить машины и посевы.',
    al_rain: 'Сильные осадки', al_rain_t: 'Ожидается {mm} осадков.',
    al_snow: 'Сильный снегопад', al_snow_t: 'Возможны заносы и трудности на дорогах.',
    al_fog: 'Туман', al_fog_t: 'Видимость на дорогах снижена.',
    al_air: 'Грязный воздух', al_air_t: 'AQI {n}. Астматикам и детям лучше остаться дома.',
    al_uv: 'Высокий УФ-индекс', al_uv_t: 'Индекс {n}. Нужны солнцезащитный крем и очки.',
    mapTitle: 'Карта температур', mapHint: 'Нажмите на область, чтобы открыть её погоду', mapCity: 'Ташкент (город)',
    footData: 'Данные', footEvery: 'обновляются каждые 15 минут', updated: 'обновлено в {t}', previewLabel: 'Предпросмотр фона:',
    pv_real: 'Реальная', pv_clear: 'Ясно', pv_night: 'Ночь', pv_cloudy: 'Облачно', pv_rain: 'Дождь', pv_storm: 'Гроза', pv_snow: 'Снег', pv_fog: 'Туман',
    demoBanner: 'Нет связи с сервисом погоды. Сейчас показаны демонстрационные данные, а не реальная погода.',
    staleBanner: 'Нет связи с сервисом погоды. Показаны данные, сохранённые в {t}.', retry: 'Повторить', loading: 'Загружаю погоду…',
    km: 'км', sel: 'выбрано'
  },
  uz: {
    title: 'O‘zbekiston ob-havosi', brand: 'O‘zbekiston ob-havosi',
    maker: 'Sayt yaratuvchisi', makerName: 'Diyorbek Madaminov', makerTitle: 'Telegram @madaminovv712 ni ochish',
    region: 'Viloyat', regionsList: 'O‘zbekiston viloyatlari', allRegions: 'Barcha viloyatlar', favorites: 'Sevimlilar',
    addFav: 'Sevimlilarga qo‘shish', removeFav: 'Sevimlilardan olib tashlash', favAdded: '{name} sevimlilarga qo‘shildi', favRemoved: '{name} sevimlilardan olib tashlandi',
    locate: 'Eng yaqin viloyatni aniqlash', locOk: 'Eng yaqin viloyat: {name}', locFar: 'Siz O‘zbekistondan uzoqdasiz. Eng yaqin viloyat: {name}',
    locDenied: 'Joylashuvga ruxsat yo‘q. Brauzer sozlamalarida ruxsat bering', locFail: 'Joylashuvni aniqlab bo‘lmadi',
    settings: 'Sozlamalar', language: 'Til', theme: 'Mavzu', dark: 'Tungi', light: 'Kunduzgi',
    temperature: 'Harorat', windSet: 'Shamol', pressureSet: 'Bosim',
    ms: 'm/s', kmh: 'km/soat', mmhg: 'mm sim. ust.', hpa: 'gPa', mm: 'mm',
    install: 'Ilova sifatida o‘rnatish', installDone: 'Ilova o‘rnatildi',
    now: 'Hozir', back: 'Hozirgi ob-havoga', today: 'Bugun', tomorrow: 'Ertaga', dayAfter: 'Indinga',
    feels: 'Sezilishi: {t}', todayRange: 'Bugun {a} dan {b} gacha', dayRange: 'Kunduz {a} gacha, tunda {b}', dayFeels: 'Kunduzi sezilishi: {t}',
    humidity: 'Namlik', windFact: 'Shamol', pressureFact: 'Bosim', precipToday: 'Bugungi yog‘in', sunrise: 'Quyosh chiqishi', sunset: 'Quyosh botishi',
    windUpTo: 'Shamol (gacha)', precip: 'Yog‘in', popProb: 'Yog‘in ehtimoli', uv: 'UB indeksi',
    hourlyTitle: 'Soatma-soat prognoz', next24: 'Keyingi 24 soat', day24: '{day}, soatlar bo‘yicha', hourlyHint: 'Barcha soatlarni ko‘rish uchun yon tomonga suring',
    hourNow: 'Hozir', rainProb: 'Yog‘in ehtimoli', temperatureLine: 'Harorat',
    weekTitle: '15 kunlik prognoz', weekHint: '{name}. Shu kundagi ob-havoni ko‘rish uchun kunni bosing.',
    airTitle: 'Havo sifati', aqiLabel: 'AQI indeksi (AQSH)', maxDay: 'Kun maksimumi', noAir: 'Havo sifati ma’lumoti yo‘q', airFar: 'Havo sifati prognozi 5 kunga mavjud',
    pm25: 'PM2.5', pm10: 'PM10', o3: 'Ozon', no2: 'NO₂',
    cat_good: 'Yaxshi', cat_moderate: 'O‘rtacha', cat_sensitive: 'Sezgirlar uchun zararli', cat_unhealthy: 'Zararli', cat_veryUnhealthy: 'Juda zararli', cat_hazardous: 'Xavfli',
    adv_good: 'Havo toza. Sayr qilish uchun yaxshi vaqt.',
    adv_moderate: 'Havo qoniqarli. Juda sezgir odamlar uzoq sayr qilmagani ma’qul.',
    adv_sensitive: 'Astma va yurak kasalligi borlar hamda bolalar ko‘chada kamroq bo‘lsin.',
    adv_unhealthy: 'Ko‘chada sport bilan shug‘ullanmang, zarur bo‘lsa niqob taqing.',
    adv_veryUnhealthy: 'Uyda qoling va derazalarni yoping.',
    adv_hazardous: 'Xavfli daraja. Ko‘chaga chiqmang.',
    tipsTitle: 'Maslahatlar', outfit: 'Nima kiyish kerak', moon: 'Oy', farm: 'Bog‘bon va fermerlar uchun',
    o_winter: 'Issiq qishki kurtka, bosh kiyim, sharf va qo‘lqop', o_cold: 'Qishki kurtka, bosh kiyim va qo‘lqop', o_cool: 'Issiq palto yoki kurtka, sharf',
    o_mild: 'Yengil kurtka yoki sviter', o_warm: 'Futbolka, kechga yengil kofta', o_hot: 'Yengil kiyim va bosh kiyim',
    o_veryHot: 'Keng, och rangli kiyim, bosh kiyim va suv olib yuring', o_extreme: 'Kunduzi quyoshga chiqmang: och rangli kiyim va ko‘p suv',
    o_rain: 'Soyabon yoki yomg‘irpo‘sh', o_snow: 'Suv o‘tkazmaydigan poyabzal', o_sun: 'Quyoshdan saqlovchi ko‘zoynak va krem', o_wind: 'Shamolga chidamli kurtka yoki kapyushonli kiyim',
    o_range: 'Kechqurun ancha sovuq bo‘ladi: kofta oling',
    ph0: 'Yangi oy', ph1: 'O‘suvchi yarim oy', ph2: 'Birinchi chorak', ph3: 'O‘suvchi oy', ph4: 'To‘lin oy', ph5: 'Kamayuvchi oy', ph6: 'Oxirgi chorak', ph7: 'Kamayuvchi yarim oy',
    illum: 'Yoritilgan: {n}%', nextFull: 'To‘lin oygacha {n} kun', nextNew: 'Yangi oygacha {n} kun',
    rain7: '7 kunlik yog‘in', frost: 'Sovuq urishi', noFrost: 'Kutilmaydi', frostOn: 'Mumkin: {days}', water: 'Sug‘orish',
    waterDryHot: 'Quruq va issiq: sug‘orish foydali', waterDry: 'Yog‘in kam: tuproq namligini kuzating', waterOk: 'Yog‘in yetarli', waterWet: 'Yog‘in ko‘p: sug‘orish shart emas',
    al_heat: 'Jazirama', al_heat_t: 'Kunduzi {t} gacha. Ko‘proq suv iching, bosh kiyim kiying.',
    al_extremeHeat: 'Kuchli jazirama', al_extremeHeat_t: 'Kunduzi {t} gacha. Soat 11 dan 17 gacha quyoshga chiqmang.',
    al_frost: 'Sovuq urishi', al_frost_t: 'Tunda {t}. Ko‘cha toyg‘oq bo‘lishi mumkin, o‘simliklarni yoping.',
    al_severeFrost: 'Qattiq sovuq', al_severeFrost_t: 'Tunda {t}. Iloji boricha issiq kiyining.',
    al_wind: 'Kuchli shamol', al_wind_t: 'Shamol zarbalari {w} gacha.',
    al_storm: 'Momaqaldiroq', al_storm_t: 'Chaqmoq va bo‘ronli shamol bo‘lishi mumkin.',
    al_hail: 'Do‘l bilan momaqaldiroq', al_hail_t: 'Do‘l mashinalar va ekinlarga zarar yetkazishi mumkin.',
    al_rain: 'Kuchli yog‘in', al_rain_t: '{mm} yog‘in kutilmoqda.',
    al_snow: 'Kuchli qor', al_snow_t: 'Yo‘llarda qiyinchilik bo‘lishi mumkin.',
    al_fog: 'Tuman', al_fog_t: 'Yo‘llarda ko‘rinish yomonlashgan.',
    al_air: 'Havo ifloslangan', al_air_t: 'AQI {n}. Astmasi borlar va bolalar uyda qolgani ma’qul.',
    al_uv: 'Yuqori UB indeksi', al_uv_t: 'Indeks {n}. Quyoshdan saqlovchi krem va ko‘zoynak kerak.',
    mapTitle: 'Harorat xaritasi', mapHint: 'Viloyat ob-havosini ochish uchun uni bosing', mapCity: 'Toshkent (shahar)',
    footData: 'Ma’lumot manbai', footEvery: 'har 15 daqiqada yangilanadi', updated: 'yangilangan: {t}', previewLabel: 'Fon namunasi:',
    pv_real: 'Haqiqiy', pv_clear: 'Ochiq', pv_night: 'Tun', pv_cloudy: 'Bulutli', pv_rain: 'Yomg‘ir', pv_storm: 'Momaqaldiroq', pv_snow: 'Qor', pv_fog: 'Tuman',
    demoBanner: 'Ob-havo xizmati bilan aloqa yo‘q. Hozir haqiqiy emas, namunaviy ma’lumotlar ko‘rsatilmoqda.',
    staleBanner: 'Ob-havo xizmati bilan aloqa yo‘q. {t} da saqlangan ma’lumotlar ko‘rsatilmoqda.', retry: 'Qayta urinish', loading: 'Ob-havo yuklanmoqda…',
    km: 'km', sel: 'tanlangan'
  }
};

/* Описания погоды по кодам WMO */
const WXTXT = {
  ru: {0:'Ясно',1:'Преимущественно ясно',2:'Переменная облачность',3:'Пасмурно',45:'Туман',48:'Изморозь и туман',
    51:'Лёгкая морось',53:'Морось',55:'Сильная морось',56:'Ледяная морось',57:'Сильная ледяная морось',
    61:'Небольшой дождь',63:'Дождь',65:'Сильный дождь',66:'Ледяной дождь',67:'Сильный ледяной дождь',
    71:'Небольшой снег',73:'Снег',75:'Сильный снегопад',77:'Снежные зёрна',80:'Небольшие ливни',81:'Ливни',82:'Сильные ливни',
    85:'Снежные заряды',86:'Сильные снежные заряды',95:'Гроза',96:'Гроза с градом',99:'Сильная гроза с градом'},
  uz: {0:'Ochiq',1:'Asosan ochiq',2:'Qisman bulutli',3:'Bulutli',45:'Tuman',48:'Qirovli tuman',
    51:'Yengil mayda yomg‘ir',53:'Mayda yomg‘ir',55:'Kuchli mayda yomg‘ir',56:'Muzlovchi mayda yomg‘ir',57:'Kuchli muzlovchi mayda yomg‘ir',
    61:'Yengil yomg‘ir',63:'Yomg‘ir',65:'Kuchli yomg‘ir',66:'Muzlovchi yomg‘ir',67:'Kuchli muzlovchi yomg‘ir',
    71:'Yengil qor',73:'Qor',75:'Kuchli qor yog‘ishi',77:'Qor donalari',80:'Yengil jala',81:'Jala',82:'Kuchli jala',
    85:'Qor jalasi',86:'Kuchli qor jalasi',95:'Momaqaldiroq',96:'Do‘l bilan momaqaldiroq',99:'Kuchli do‘l bilan momaqaldiroq'}
};
const textOf = c => (WXTXT[LANG] && WXTXT[LANG][c]) || WXTXT.ru[c] || WXTXT.ru[0];

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]);
  if (s === undefined) s = I18N.ru[key];
  if (s === undefined) return key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m) : s;
}

/* ---------- Даты (Узбекистан живёт по UTC+5 без перехода на летнее время) ---------- */
const NAMES = {
  ru: {wdS:['Вс','Пн','Вт','Ср','Чт','Пт','Сб'], wdL:['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
       monS:['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'],
       monG:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
       dir:['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ']},
  uz: {wdS:['Yak','Dush','Sesh','Chor','Pay','Juma','Shan'], wdL:['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'],
       monS:['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'],
       monG:['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktyabr','noyabr','dekabr'],
       dir:['Shm','Shm-Shq','Shq','Jan-Shq','Jan','Jan-G‘','G‘','Shm-G‘']}
};
const nm = () => NAMES[LANG];
const p2 = n => String(n).padStart(2, '0');

/* Текущая дата и время в Ташкенте */
function tz(d = new Date()) {
  const s = new Date(d.getTime() + 5 * 36e5);
  return {y:s.getUTCFullYear(), m:s.getUTCMonth() + 1, d:s.getUTCDate(), wd:s.getUTCDay(), h:s.getUTCHours(), mi:s.getUTCMinutes()};
}
/* '2026-10-28' или '2026-10-28T06:41' */
function ymd(s) {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return {y, m, d, wd:new Date(Date.UTC(y, m - 1, d)).getUTCDay()};
}
const dmShort = o => LANG === 'uz' ? `${o.d}-${nm().monS[o.m - 1]}` : `${o.d} ${nm().monS[o.m - 1]}`;
const dmLong = o => LANG === 'uz' ? `${o.d}-${nm().monG[o.m - 1]}` : `${o.d} ${nm().monG[o.m - 1]}`;
const dirOf = d => d == null ? '' : nm().dir[Math.round(d / 45) % 8];
