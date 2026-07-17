import {
  bookAuthorSchema,
  bookCategorySchema,
  bookCoverAssetSchema,
  bookEditionSchema,
  bookPublisherSchema,
  bookWorkSchema,
} from "@/lib/validation/domain";
import type {
  BookAuthor,
  BookCategory,
  BookCategorySlug,
  BookCoverAsset,
  BookEdition,
  BookFormat,
  BookPublisher,
  BookWork,
  EditionLanguage,
  LocalizedText,
  SourceNote,
} from "@/types/domain";

const CREATED_AT = "2026-07-16T00:00:00.000Z";
const placeholderCoverAssetId = stableUuid(50);

const publicDomainSourceNote: SourceNote = {
  label: "Public-domain/classic bibliographic metadata cross-checked from Project Gutenberg and Open Library public records",
  url: "https://www.gutenberg.org/",
  license: "Bibliographic facts only; summaries are project-written",
  checkedAt: "2026-07-16T00:00:00.000Z",
};

const demoPublisherId = stableUuid(1);

type CategorySeed = {
  slug: BookCategorySlug;
  labels: LocalizedText;
  description: LocalizedText;
};

type AuthorSeed = {
  slug: string;
  name: string;
  country: string | null;
};

type WorkSeed = {
  slug: string;
  title: string;
  viTitle: string;
  originalTitle: string | null;
  authorSlugs: string[];
  originalLanguage: string;
  categorySlugs: BookCategorySlug[];
  themes: string[];
  ageRating: string | null;
  publicationEra: string;
  publicationYear: number | null;
  summary: LocalizedText;
};

const categorySeeds: CategorySeed[] = [
  {
    slug: "fiction",
    labels: { vi: "Van hoc", en: "Fiction" },
    description: {
      vi: "Tieu thuyet va tac pham hu cau de doc theo chu de, tac gia va ngon ngu.",
      en: "Novels and fiction works browsed by theme, author, and language.",
    },
  },
  {
    slug: "classic-literature",
    labels: { vi: "Van hoc kinh dien", en: "Classic literature" },
    description: {
      vi: "Nhung tac pham lau ben, phu hop cho tu sach ca nhan va hoc thuat.",
      en: "Enduring works suited for personal libraries and study shelves.",
    },
  },
  {
    slug: "mystery-thriller",
    labels: { vi: "Trinh tham va hoi hop", en: "Mystery and thriller" },
    description: {
      vi: "Cac cau chuyen dieu tra, bi an va khong khi cang thang.",
      en: "Investigation, suspense, and mystery-driven reading choices.",
    },
  },
  {
    slug: "fantasy-sci-fi",
    labels: { vi: "Gia tuong va khoa hoc vien tuong", en: "Fantasy and sci-fi" },
    description: {
      vi: "Phieu luu ky ao, tuong lai gia dinh va the gioi tuong tuong.",
      en: "Inventive adventures, imagined worlds, and speculative classics.",
    },
  },
  {
    slug: "romance",
    labels: { vi: "Lang man", en: "Romance" },
    description: {
      vi: "Nhung cau chuyen ve tinh cam, hon nhan, lua chon va truong thanh.",
      en: "Stories of affection, marriage, choice, and personal growth.",
    },
  },
  {
    slug: "business-economics",
    labels: { vi: "Kinh doanh va kinh te", en: "Business and economics" },
    description: {
      vi: "Sach ve chien luoc, kinh te va tu duy dieu hanh cho nguoi doc thuc te.",
      en: "Strategy, economics, and practical operating ideas for business readers.",
    },
  },
  {
    slug: "self-development",
    labels: { vi: "Phat trien ban than", en: "Self-development" },
    description: {
      vi: "Sach ve ky luat, suy ngam, dao duc va thoi quen tu hoc.",
      en: "Books on discipline, reflection, ethics, and self-directed growth.",
    },
  },
  {
    slug: "children-young-adult",
    labels: { vi: "Thieu nhi va tuoi teen", en: "Children and young adult" },
    description: {
      vi: "Tac pham phu hop cho doc gia nho tuoi, gia dinh va truong hoc.",
      en: "Books suited to younger readers, families, and classroom shelves.",
    },
  },
  {
    slug: "language-learning",
    labels: { vi: "Hoc ngoai ngu", en: "Language learning" },
    description: {
      vi: "Sach ho tro ngu phap, tu vung, doc hieu va hoc tieng Anh.",
      en: "Books supporting grammar, vocabulary, reading, and English study.",
    },
  },
  {
    slug: "vietnamese-books",
    labels: { vi: "Sach tieng Viet", en: "Vietnamese books" },
    description: {
      vi: "Loi tat den cac an ban tieng Viet va ban dich tieng Viet.",
      en: "Shortcut to Vietnamese-language editions and Vietnamese translations.",
    },
  },
  {
    slug: "english-books",
    labels: { vi: "Sach tieng Anh", en: "English books" },
    description: {
      vi: "Loi tat den cac an ban tieng Anh cho nguoi doc song ngu.",
      en: "Shortcut to English-language editions for bilingual readers.",
    },
  },
];

const authorSeeds: AuthorSeed[] = [
  { slug: "jane-austen", name: "Jane Austen", country: "United Kingdom" },
  { slug: "charlotte-bronte", name: "Charlotte Bronte", country: "United Kingdom" },
  { slug: "emily-bronte", name: "Emily Bronte", country: "United Kingdom" },
  { slug: "charles-dickens", name: "Charles Dickens", country: "United Kingdom" },
  { slug: "herman-melville", name: "Herman Melville", country: "United States" },
  { slug: "louisa-may-alcott", name: "Louisa May Alcott", country: "United States" },
  { slug: "arthur-conan-doyle", name: "Arthur Conan Doyle", country: "United Kingdom" },
  { slug: "bram-stoker", name: "Bram Stoker", country: "Ireland" },
  { slug: "mary-shelley", name: "Mary Shelley", country: "United Kingdom" },
  { slug: "oscar-wilde", name: "Oscar Wilde", country: "Ireland" },
  { slug: "alexandre-dumas", name: "Alexandre Dumas", country: "France" },
  { slug: "victor-hugo", name: "Victor Hugo", country: "France" },
  { slug: "jules-verne", name: "Jules Verne", country: "France" },
  { slug: "h-g-wells", name: "H. G. Wells", country: "United Kingdom" },
  { slug: "lewis-carroll", name: "Lewis Carroll", country: "United Kingdom" },
  { slug: "l-frank-baum", name: "L. Frank Baum", country: "United States" },
  { slug: "frances-hodgson-burnett", name: "Frances Hodgson Burnett", country: "United Kingdom" },
  { slug: "lucy-maud-montgomery", name: "L. M. Montgomery", country: "Canada" },
  { slug: "robert-louis-stevenson", name: "Robert Louis Stevenson", country: "United Kingdom" },
  { slug: "jack-london", name: "Jack London", country: "United States" },
  { slug: "rudyard-kipling", name: "Rudyard Kipling", country: "United Kingdom" },
  { slug: "kenneth-grahame", name: "Kenneth Grahame", country: "United Kingdom" },
  { slug: "mark-twain", name: "Mark Twain", country: "United States" },
  { slug: "fyodor-dostoevsky", name: "Fyodor Dostoevsky", country: "Russia" },
  { slug: "leo-tolstoy", name: "Leo Tolstoy", country: "Russia" },
  { slug: "franz-kafka", name: "Franz Kafka", country: "Czech Republic" },
  { slug: "hermann-hesse", name: "Hermann Hesse", country: "Germany" },
  { slug: "kahlil-gibran", name: "Kahlil Gibran", country: "Lebanon" },
  { slug: "sun-tzu", name: "Sun Tzu", country: "China" },
  { slug: "marcus-aurelius", name: "Marcus Aurelius", country: "Roman Empire" },
  { slug: "laozi", name: "Laozi", country: "China" },
  { slug: "plato", name: "Plato", country: "Greece" },
  { slug: "miguel-de-cervantes", name: "Miguel de Cervantes", country: "Spain" },
  { slug: "dante-alighieri", name: "Dante Alighieri", country: "Italy" },
  { slug: "homer", name: "Homer", country: "Greece" },
  { slug: "jacob-grimm", name: "Jacob Grimm", country: "Germany" },
  { slug: "wilhelm-grimm", name: "Wilhelm Grimm", country: "Germany" },
  { slug: "hans-christian-andersen", name: "Hans Christian Andersen", country: "Denmark" },
  { slug: "aesop", name: "Aesop", country: "Greece" },
  { slug: "adam-smith", name: "Adam Smith", country: "United Kingdom" },
  { slug: "william-strunk-jr", name: "William Strunk Jr.", country: "United States" },
];

const workSeeds: WorkSeed[] = [
  classic("pride-and-prejudice", "Pride and Prejudice", "Kieu hanh va dinh kien", "Jane Austen", ["jane-austen"], "English", ["classic-literature", "romance"], ["family", "manners", "marriage"], "1813", 1813, "A sharp social novel about judgment, family pressure, and the cost of confusing first impressions with truth.", "Mot tieu thuyet xa hoi sac sat ve dinh kien, ap luc gia dinh va cai gia cua viec danh gia nguoi khac qua an tuong dau tien."),
  classic("jane-eyre", "Jane Eyre", "Jane Eyre", "Charlotte Bronte", ["charlotte-bronte"], "English", ["classic-literature", "romance"], ["independence", "identity", "gothic"], "1847", 1847, "A resilient governess protects her conscience while seeking dignity, love, and a place where she can live honestly.", "Mot co gia sư kien cuong giu vung luong tam trong hanh trinh tim nhan pham, tinh yeu va mot noi song thanh that."),
  classic("wuthering-heights", "Wuthering Heights", "Doi gio hu", "Emily Bronte", ["emily-bronte"], "English", ["classic-literature", "romance"], ["obsession", "revenge", "moorland"], "1847", 1847, "A turbulent story of love, pride, and revenge that turns one household's wounds into a generational storm.", "Cau chuyen day bien dong ve tinh yeu, kieu hanh va thu han, noi vet thuong gia dinh tro thanh con bao qua nhieu the he."),
  classic("great-expectations", "Great Expectations", "Ky vong lon lao", "Charles Dickens", ["charles-dickens"], "English", ["classic-literature", "fiction"], ["ambition", "class", "coming-of-age"], "1861", 1861, "A young man's rise exposes how ambition, shame, and misplaced admiration can distort the idea of success.", "Hanh trinh truong thanh cua mot chang trai cho thay tham vong, xau ho va su nguong mo sai cho co the bop meo dinh nghia thanh cong."),
  classic("oliver-twist", "Oliver Twist", "Oliver Twist", "Charles Dickens", ["charles-dickens"], "English", ["classic-literature", "fiction"], ["poverty", "childhood", "crime"], "1838", 1838, "A vulnerable orphan moves through hardship and danger while the city reveals both cruelty and unexpected kindness.", "Mot cau be mo coi mong manh buoc qua ngheo kho va hiem nguy, trong khi thanh pho phoi bay ca su tan nhan lan long tot bat ngo."),
  classic("a-tale-of-two-cities", "A Tale of Two Cities", "Hai kinh thanh", "Charles Dickens", ["charles-dickens"], "English", ["classic-literature", "fiction"], ["revolution", "sacrifice", "justice"], "1859", 1859, "A drama of revolution and sacrifice that connects private loyalty with the violence of public history.", "Mot bi kich ve cach mang va hy sinh, noi long trung thanh rieng tu va bao luc lich su cong cong giao nhau."),
  classic("moby-dick", "Moby-Dick", "Ca voi trang", "Herman Melville", ["herman-melville"], "English", ["classic-literature", "fiction"], ["obsession", "sea", "fate"], "1851", 1851, "A sea voyage becomes a vast meditation on obsession, authority, nature, and the limits of human control.", "Mot chuyen di bien ca bien thanh suy ngam lon ve am anh, quyen luc, thien nhien va gioi han kiem soat cua con nguoi."),
  classic("little-women", "Little Women", "Nhung nguoi phu nu be nho", "Louisa May Alcott", ["louisa-may-alcott"], "English", ["classic-literature", "children-young-adult"], ["sisters", "family", "growth"], "1868", 1868, "Four sisters grow through work, friendship, disappointment, and care while each defines a different kind of adulthood.", "Bon chi em truong thanh qua lao dong, tinh ban, that vong va su cham soc, moi nguoi tu dinh nghia mot cach lon len rieng."),
  classic("the-adventures-of-sherlock-holmes", "The Adventures of Sherlock Holmes", "Nhung cuoc phieu luu cua Sherlock Holmes", "Arthur Conan Doyle", ["arthur-conan-doyle"], "English", ["mystery-thriller", "classic-literature"], ["deduction", "crime", "logic"], "1892", 1892, "A collection of detective cases built on observation, logic, and the pleasure of watching hidden patterns surface.", "Tap truyen trinh tham dua tren quan sat, ly luan va niem vui khi nhung mau hinh an giau dan lo dien."),
  classic("dracula", "Dracula", "Dracula", "Bram Stoker", ["bram-stoker"], "English", ["mystery-thriller", "fantasy-sci-fi"], ["gothic", "fear", "letters"], "1897", 1897, "A gothic pursuit told through documents, where fear spreads through travel, rumor, and the threat of the unknown.", "Mot cuoc truy duoi gothic ke qua thu tu va nhat ky, noi noi so lan qua chuyen di, loi don va dieu chua biet."),
  classic("frankenstein", "Frankenstein", "Frankenstein", "Mary Shelley", ["mary-shelley"], "English", ["classic-literature", "fantasy-sci-fi"], ["creation", "responsibility", "isolation"], "1818", 1818, "A creator's ambition turns into a moral reckoning about loneliness, responsibility, and what makes a person human.", "Tham vong cua nguoi tao ra sinh the bien thanh cau hoi dao duc ve co doc, trach nhiem va dieu lam nen con nguoi."),
  classic("the-picture-of-dorian-gray", "The Picture of Dorian Gray", "Chan dung Dorian Gray", "Oscar Wilde", ["oscar-wilde"], "English", ["classic-literature", "fiction"], ["beauty", "corruption", "art"], "1890", 1890, "A stylish moral tale about beauty, influence, and the hidden cost of treating life as an artwork without conscience.", "Mot cau chuyen dao duc day phong cach ve cai dep, anh huong va cai gia khi xem doi song nhu tac pham nghe thuat khong luong tam."),
  classic("the-count-of-monte-cristo", "The Count of Monte Cristo", "Ba tuoc Monte Cristo", "Alexandre Dumas", ["alexandre-dumas"], "French", ["classic-literature", "fiction"], ["revenge", "justice", "identity"], "1844", 1844, "An epic revenge story where patience, wealth, and planning test whether justice can remain separate from vengeance.", "Mot thien truyen bao thu noi su kien nhan, tien bac va ke hoach thu thach ranh gioi giua cong ly va thu han."),
  classic("les-miserables", "Les Miserables", "Nhung nguoi khon kho", "Victor Hugo", ["victor-hugo"], "French", ["classic-literature", "fiction"], ["mercy", "poverty", "law"], "1862", 1862, "A broad human drama about law, mercy, poverty, and the possibility of moral renewal after failure.", "Mot bi kich nhan sinh rong lon ve luat phap, long thuong, ngheo kho va kha nang doi moi dao duc sau sai lam."),
  classic("the-three-musketeers", "The Three Musketeers", "Ba chang linh ngu lam", "Alexandre Dumas", ["alexandre-dumas"], "French", ["classic-literature", "fiction"], ["friendship", "adventure", "honor"], "1844", 1844, "A fast adventure of loyalty, rivalry, and political danger centered on friendship under pressure.", "Mot cuoc phieu luu nhanh ve long trung thanh, canh tranh va hiem nguy chinh tri, xoay quanh tinh ban trong thu thach."),
  classic("around-the-world-in-eighty-days", "Around the World in Eighty Days", "Vong quanh the gioi trong 80 ngay", "Jules Verne", ["jules-verne"], "French", ["classic-literature", "fantasy-sci-fi"], ["travel", "time", "adventure"], "1872", 1872, "A race around the globe turns punctuality, money, and confidence into a playful test of modern travel.", "Cuoc dua vong quanh the gioi bien dung gio, tien bac va su tu tin thanh phep thu vui ve cua thoi dai di chuyen hien dai."),
  classic("journey-to-the-center-of-the-earth", "Journey to the Center of the Earth", "Cuoc du hanh vao long dat", "Jules Verne", ["jules-verne"], "French", ["fantasy-sci-fi", "children-young-adult"], ["science", "exploration", "adventure"], "1864", 1864, "A scientific expedition becomes an imaginative descent into risk, curiosity, and the thrill of discovery.", "Mot chuyen tham hiem khoa hoc tro thanh cuoc di xuong day tuong tuong ve rui ro, to mo va niem vui kham pha."),
  classic("the-time-machine", "The Time Machine", "Co may thoi gian", "H. G. Wells", ["h-g-wells"], "English", ["fantasy-sci-fi", "classic-literature"], ["future", "class", "evolution"], "1895", 1895, "A journey into the distant future turns speculation into a warning about comfort, inequality, and decline.", "Chuyen di den tuong lai xa bien tuong tuong khoa hoc thanh loi canh bao ve tien nghi, bat binh dang va suy thoai."),
  classic("the-war-of-the-worlds", "The War of the Worlds", "Chien tranh giua cac the gioi", "H. G. Wells", ["h-g-wells"], "English", ["fantasy-sci-fi", "mystery-thriller"], ["invasion", "fear", "survival"], "1898", 1898, "An invasion story that makes ordinary streets feel fragile when confronted by a power beyond human preparation.", "Mot cau chuyen xam lang khien pho phuong quen thuoc tro nen mong manh truoc suc manh nam ngoai moi chuan bi cua con nguoi."),
  classic("alice-in-wonderland", "Alice's Adventures in Wonderland", "Alice o xu so than tien", "Lewis Carroll", ["lewis-carroll"], "English", ["children-young-adult", "fantasy-sci-fi"], ["nonsense", "curiosity", "logic"], "1865", 1865, "A playful fantasy where a child's curiosity meets rules that bend, break, and turn language into a game.", "Mot truyen ky ao vui tuoi noi su to mo cua tre nho gap nhung quy tac bien doi, vo tung va bien ngon ngu thanh tro choi."),
  classic("the-wonderful-wizard-of-oz", "The Wonderful Wizard of Oz", "Phu thuy xu Oz", "L. Frank Baum", ["l-frank-baum"], "English", ["children-young-adult", "fantasy-sci-fi"], ["home", "friendship", "quest"], "1900", 1900, "A colorful quest about home, courage, intelligence, and the friends who help make those qualities visible.", "Mot hanh trinh sac mau ve mai nha, long can dam, tri tue va nhung nguoi ban giup cac pham chat ay hien ro."),
  classic("the-secret-garden", "The Secret Garden", "Khu vuon bi mat", "Frances Hodgson Burnett", ["frances-hodgson-burnett"], "English", ["children-young-adult", "classic-literature"], ["healing", "friendship", "nature"], "1911", 1911, "A lonely child discovers that care, fresh air, and small daily acts can restore both gardens and people.", "Mot dua tre co don nhan ra su cham soc, khong khi trong lanh va hanh dong nho moi ngay co the hoi sinh ca khu vuon lan con nguoi."),
  classic("anne-of-green-gables", "Anne of Green Gables", "Anne toc do duoi mai nha xanh", "L. M. Montgomery", ["lucy-maud-montgomery"], "English", ["children-young-adult", "classic-literature"], ["imagination", "family", "belonging"], "1908", 1908, "An imaginative orphan finds belonging while her mistakes, hopes, and words reshape a quiet household.", "Mot co be mo coi giau tri tuong tuong tim thay noi thuoc ve khi sai lam, hy vong va ngon tu cua em lam thay doi mot gia dinh yen binh."),
  classic("treasure-island", "Treasure Island", "Dao giau vang", "Robert Louis Stevenson", ["robert-louis-stevenson"], "English", ["children-young-adult", "fiction"], ["pirates", "treasure", "risk"], "1883", 1883, "A treasure hunt full of shifting loyalties where adventure teaches caution as much as courage.", "Cuoc san tim kho bau day long trung thanh doi thay, noi phieu luu day ca su than trong lan long can dam."),
  classic("the-call-of-the-wild", "The Call of the Wild", "Tieng goi noi hoang da", "Jack London", ["jack-london"], "English", ["classic-literature", "fiction"], ["wilderness", "survival", "instinct"], "1903", 1903, "A survival story about instinct, adaptation, and the pull of a harsher life beyond domestic comfort.", "Cau chuyen sinh ton ve ban nang, thich nghi va suc hut cua doi song khac nghiet ben ngoai tien nghi quen thuoc."),
  classic("the-jungle-book", "The Jungle Book", "Sach rung xanh", "Rudyard Kipling", ["rudyard-kipling"], "English", ["children-young-adult", "classic-literature"], ["jungle", "law", "belonging"], "1894", 1894, "Linked animal stories explore belonging, discipline, and the rules that hold a community together.", "Nhung cau chuyen ve muong thu noi ket thanh suy ngam ve noi thuoc ve, ky luat va cac quy tac giu mot cong dong dung vung."),
  classic("the-wind-in-the-willows", "The Wind in the Willows", "Gio qua rang lieu", "Kenneth Grahame", ["kenneth-grahame"], "English", ["children-young-adult", "classic-literature"], ["friendship", "river", "home"], "1908", 1908, "A gentle riverbank story about friendship, restlessness, home, and the comic trouble caused by vanity.", "Mot cau chuyen nhe nhang ben bo song ve tinh ban, su bon chon, mai nha va nhung rac roi hai huoc do tinh tu phu."),
  classic("a-christmas-carol", "A Christmas Carol", "Bai ca Giang sinh", "Charles Dickens", ["charles-dickens"], "English", ["classic-literature", "fiction"], ["redemption", "generosity", "memory"], "1843", 1843, "A compact moral tale where memory and imagination push a miser toward generosity and repair.", "Mot cau chuyen dao duc ngan gon noi ky uc va tuong tuong thuc day mot ke keo kiet huong den rong luong va sua sai."),
  classic("the-adventures-of-tom-sawyer", "The Adventures of Tom Sawyer", "Nhung cuoc phieu luu cua Tom Sawyer", "Mark Twain", ["mark-twain"], "English", ["children-young-adult", "fiction"], ["childhood", "mischief", "river"], "1876", 1876, "A lively childhood story where play, fear, and conscience meet along the river and the town street.", "Cau chuyen tuoi tho sinh dong noi tro choi, noi so va luong tam gap nhau ben dong song va pho thi tran."),
  classic("adventures-of-huckleberry-finn", "Adventures of Huckleberry Finn", "Nhung cuoc phieu luu cua Huckleberry Finn", "Mark Twain", ["mark-twain"], "English", ["classic-literature", "fiction"], ["river", "freedom", "conscience"], "1884", 1884, "A river journey that forces a young narrator to weigh friendship, freedom, and the morals he was taught.", "Chuyen di tren song buoc nguoi ke chuyen tre tuoi can nhac tinh ban, tu do va nhung dao ly da duoc day."),
  classic("the-brothers-karamazov", "The Brothers Karamazov", "Anh em nha Karamazov", "Fyodor Dostoevsky", ["fyodor-dostoevsky"], "Russian", ["classic-literature", "fiction"], ["faith", "family", "guilt"], "1880", 1880, "A family tragedy expands into questions about faith, freedom, guilt, and responsibility before others.", "Bi kich gia dinh mo rong thanh cau hoi ve duc tin, tu do, toi loi va trach nhiem truoc nguoi khac."),
  classic("crime-and-punishment", "Crime and Punishment", "Toi ac va hinh phat", "Fyodor Dostoevsky", ["fyodor-dostoevsky"], "Russian", ["classic-literature", "mystery-thriller"], ["guilt", "poverty", "conscience"], "1866", 1866, "A psychological novel about a crime, the pressure of guilt, and the painful need for moral recognition.", "Tieu thuyet tam ly ve mot toi ac, suc ep cua mac cam toi loi va nhu cau dau don duoc thua nhan dao duc."),
  classic("anna-karenina", "Anna Karenina", "Anna Karenina", "Leo Tolstoy", ["leo-tolstoy"], "Russian", ["classic-literature", "romance"], ["love", "society", "family"], "1878", 1878, "A broad social novel where private desire collides with family, reputation, and the search for meaning.", "Mot tieu thuyet xa hoi rong lon noi khat vong rieng va cham voi gia dinh, danh tieng va viec tim y nghia."),
  classic("war-and-peace", "War and Peace", "Chien tranh va hoa binh", "Leo Tolstoy", ["leo-tolstoy"], "Russian", ["classic-literature", "fiction"], ["history", "war", "family"], "1869", 1869, "A sweeping account of families and war that asks how private lives move inside vast historical forces.", "Mot buc tranh rong ve gia dinh va chien tranh, dat cau hoi doi song rieng chuyen dong ra sao trong nhung luc day lich su lon."),
  classic("the-metamorphosis", "The Metamorphosis", "Hoa than", "Franz Kafka", ["franz-kafka"], "German", ["classic-literature", "fiction"], ["alienation", "family", "absurdity"], "1915", 1915, "A strange transformation exposes the fragility of duty, family affection, and a person's place in the home.", "Mot su bien doi ky la phoi bay tinh mong manh cua nghia vu, tinh than gia dinh va vi tri cua mot nguoi trong nha."),
  classic("siddhartha", "Siddhartha", "Siddhartha", "Hermann Hesse", ["hermann-hesse"], "German", ["self-development", "classic-literature"], ["search", "wisdom", "renunciation"], "1922", 1922, "A spiritual journey follows a seeker who learns that wisdom cannot simply be borrowed from teachers.", "Hanh trinh tinh than cua mot nguoi tim dao cho thay tri tue khong the chi muon tam tu thay day."),
  classic("the-prophet", "The Prophet", "Nha tien tri", "Kahlil Gibran", ["kahlil-gibran"], "English", ["self-development", "classic-literature"], ["wisdom", "love", "community"], "1923", 1923, "A lyrical set of reflections on love, work, freedom, grief, and the ties that shape a community.", "Tap suy ngam giau chat tho ve tinh yeu, cong viec, tu do, noi buon va nhung moi day tao nen cong dong."),
  classic("the-art-of-war", "The Art of War", "Binh phap Ton Tu", "Sun Tzu", ["sun-tzu"], "Classical Chinese", ["business-economics", "self-development"], ["strategy", "leadership", "conflict"], "ancient China", null, "A compact strategy text that treats conflict as a matter of preparation, timing, restraint, and clear judgment.", "Van ban chien luoc ngan gon xem xung dot nhu van de cua chuan bi, thoi diem, tiet che va phan doan sang suot."),
  classic("meditations", "Meditations", "Suy tuong", "Marcus Aurelius", ["marcus-aurelius"], "Greek", ["self-development", "classic-literature"], ["stoicism", "discipline", "reflection"], "2nd century", null, "Private reflections on discipline, duty, mortality, and the daily practice of keeping judgment steady.", "Nhung suy ngam rieng ve ky luat, bon phan, cai chet va viec luyen tap moi ngay de giu phan doan vung vang."),
  classic("tao-te-ching", "Tao Te Ching", "Dao duc kinh", "Laozi", ["laozi"], "Classical Chinese", ["self-development", "classic-literature"], ["dao", "simplicity", "power"], "ancient China", null, "A concise philosophical text that values simplicity, softness, restraint, and action that does not force.", "Van ban triet hoc ngan gon de cao gian di, mem deo, tiet che va hanh dong khong cuong ep."),
  classic("the-republic", "The Republic", "Cong hoa", "Plato", ["plato"], "Ancient Greek", ["classic-literature", "business-economics"], ["justice", "education", "state"], "ancient Greece", null, "A philosophical dialogue about justice, education, power, and the structure of a well-ordered city.", "Mot doi thoai triet hoc ve cong ly, giao duc, quyen luc va cau truc cua mot thanh bang co trat tu."),
  classic("don-quixote", "Don Quixote", "Don Quixote", "Miguel de Cervantes", ["miguel-de-cervantes"], "Spanish", ["classic-literature", "fiction"], ["idealism", "satire", "adventure"], "1605", 1605, "A comic journey where old stories of heroism collide with practical reality and stubborn imagination.", "Chuyen di hai huoc noi nhung cau chuyen hiep si cu va cham voi thuc te doi thuong va tri tuong tuong ben bi."),
  classic("the-divine-comedy", "The Divine Comedy", "Than khuc", "Dante Alighieri", ["dante-alighieri"], "Italian", ["classic-literature", "fiction"], ["journey", "afterlife", "moral order"], "1321", null, "A visionary journey through moral landscapes that turns exile, judgment, and hope into poetry.", "Hanh trinh thi kien qua nhung canh gioi dao duc, bien luu day, phan xet va hy vong thanh thi ca."),
  classic("the-iliad", "The Iliad", "Iliad", "Homer", ["homer"], "Ancient Greek", ["classic-literature", "fiction"], ["war", "honor", "anger"], "ancient Greece", null, "An epic of war and anger that studies honor, grief, and the human cost of heroic reputation.", "Su thi ve chien tranh va con gian, soi xet danh du, dau thuong va cai gia con nguoi cua tieng tam anh hung."),
  classic("the-odyssey", "The Odyssey", "Odyssey", "Homer", ["homer"], "Ancient Greek", ["classic-literature", "fiction"], ["homecoming", "sea", "cunning"], "ancient Greece", null, "A homecoming epic where endurance, wit, memory, and loyalty matter as much as force.", "Su thi tro ve noi long ben bi, tri khon, ky uc va chung thuy quan trong khong kem suc manh."),
  classic("grimms-fairy-tales", "Grimms' Fairy Tales", "Truyen co Grimm", "Jacob and Wilhelm Grimm", ["jacob-grimm", "wilhelm-grimm"], "German", ["children-young-adult", "fantasy-sci-fi"], ["fairy tales", "folklore", "lessons"], "1812", 1812, "A collection of folk tales whose strange tests, bargains, and transformations still shape children's storytelling.", "Tap truyen dan gian voi thu thach, giao keo va bien hoa ky la van anh huong manh den truyen ke cho tre em."),
  classic("andersens-fairy-tales", "Andersen's Fairy Tales", "Truyen co Andersen", "Hans Christian Andersen", ["hans-christian-andersen"], "Danish", ["children-young-adult", "fantasy-sci-fi"], ["fairy tales", "empathy", "wonder"], "1835", 1835, "A set of literary fairy tales where wonder often carries tenderness, sorrow, and moral attention.", "Tap co tich van hoc noi dieu ky dieu thuong mang theo su diu dang, noi buon va cai nhin dao duc."),
  classic("aesops-fables", "Aesop's Fables", "Ngu ngon Aesop", "Aesop", ["aesop"], "Ancient Greek", ["children-young-adult", "self-development"], ["fables", "ethics", "animals"], "ancient Greece", null, "Short fables use memorable situations to sharpen practical judgment about pride, trust, and consequence.", "Nhung truyen ngu ngon ngan dung tinh huong de nho nham ren phan doan thuc te ve kieu hanh, niem tin va he qua."),
  classic("the-wealth-of-nations", "The Wealth of Nations", "Su giau co cua cac quoc gia", "Adam Smith", ["adam-smith"], "English", ["business-economics", "classic-literature"], ["markets", "labor", "commerce"], "1776", 1776, "A foundational economics work about labor, markets, incentives, and the organization of commercial life.", "Tac pham kinh te nen tang ve lao dong, thi truong, dong luc va cach doi song thuong mai duoc to chuc."),
  classic("the-elements-of-style", "The Elements of Style", "Cac yeu to cua van phong", "William Strunk Jr.", ["william-strunk-jr"], "English", ["language-learning", "self-development"], ["writing", "grammar", "clarity"], "1918", 1918, "A concise writing guide focused on clear sentences, firm revision, and habits that reduce confusion.", "Huong dan viet ngan gon tap trung vao cau van ro rang, sua ban thao dut khoat va thoi quen giam nham lan."),
];

export const bookCategories: BookCategory[] = categorySeeds.map((category, index) =>
  bookCategorySchema.parse({
    id: stableUuid(100 + index),
    slug: category.slug,
    labels: category.labels,
    description: category.description,
    sortOrder: index,
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
);

export const bookAuthors: BookAuthor[] = authorSeeds.map((author, index) =>
  bookAuthorSchema.parse({
    id: stableUuid(1_000 + index),
    slug: author.slug,
    name: author.name,
    bioShort: null,
    country: author.country,
    birthYear: null,
    deathYear: null,
    sourceNote: publicDomainSourceNote,
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
);

export const bookPublishers: BookPublisher[] = [
  bookPublisherSchema.parse({
    id: demoPublisherId,
    slug: "caseflow-books-demo-editions",
    name: "CaseFlow Books Demo Editions",
    country: "Vietnam",
    website: null,
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
];

export const bookCoverAssets: BookCoverAsset[] = [
  bookCoverAssetSchema.parse({
    id: placeholderCoverAssetId,
    path: "/images/books/placeholders/book-cover-placeholder.svg",
    altText: {
      en: "CaseFlow Books internal placeholder cover",
      vi: "Bia sach tam thoi noi bo cua CaseFlow Books",
    },
    source: "internal",
    sourceNote: {
      label: "Project-created SVG placeholder",
      url: null,
      license: "Internal project asset",
      checkedAt: CREATED_AT,
    },
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
];

const categoryBySlug = new Map(bookCategories.map((category) => [category.slug, category]));
const authorBySlug = new Map(bookAuthors.map((author) => [author.slug, author]));

export const bookWorks: BookWork[] = workSeeds.map((work, index) => {
  const authors = work.authorSlugs.map((slug) => required(authorBySlug.get(slug), `Missing author ${slug}`));
  const categories = work.categorySlugs.map((slug) => required(categoryBySlug.get(slug), `Missing category ${slug}`));

  return bookWorkSchema.parse({
    id: stableUuid(2_000 + index),
    slug: work.slug,
    title: work.title,
    originalTitle: work.originalTitle,
    localizedTitle: { en: work.title, vi: work.viTitle },
    primaryAuthorIds: authors.map((author) => author.id),
    originalLanguage: work.originalLanguage,
    categoryIds: categories.map((category) => category.id),
    themes: work.themes,
    ageRating: work.ageRating,
    publicationEra: work.publicationEra,
    canonicalSummary: work.summary,
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  });
});

export const bookEditions: BookEdition[] = workSeeds.flatMap((work, index) => {
  const bookWork = required(
    bookWorks.find((candidate) => candidate.slug === work.slug),
    `Missing generated work ${work.slug}`,
  );
  return [
    createEdition(work, bookWork, index, "en"),
    createEdition(work, bookWork, index, "vi"),
  ];
});

export const caseflowBooksSeed = {
  categories: bookCategories,
  authors: bookAuthors,
  translators: [],
  publishers: bookPublishers,
  coverAssets: bookCoverAssets,
  works: bookWorks,
  editions: bookEditions,
} as const;

export const caseflowBooksSeedSummary = {
  categoryCount: bookCategories.length,
  authorCount: bookAuthors.length,
  publisherCount: bookPublishers.length,
  workCount: bookWorks.length,
  editionCount: bookEditions.length,
  languageCounts: countBy(bookEditions, (edition) => edition.language),
  formatCounts: countBy(bookEditions, (edition) => edition.format),
  categoryWorkCounts: Object.fromEntries(
    bookCategories.map((category) => [
      category.slug,
      bookWorks.filter((work) => work.categoryIds.includes(category.id)).length,
    ]),
  ),
  featuredEditionCount: bookEditions.filter((edition) => edition.isFeatured).length,
} as const;

assertSeedQuality();

function classic(
  slug: string,
  title: string,
  viTitle: string,
  originalTitle: string | null,
  authorSlugs: string[],
  originalLanguage: string,
  categorySlugs: BookCategorySlug[],
  themes: string[],
  publicationEra: string,
  publicationYear: number | null,
  en: string,
  vi: string,
): WorkSeed {
  const verifiedOriginalTitle =
    originalTitle &&
    originalTitle !== title &&
    !authorSeeds.some((author) => author.name === originalTitle)
      ? originalTitle
      : null;

  return {
    slug,
    title,
    viTitle,
    originalTitle: verifiedOriginalTitle,
    authorSlugs,
    originalLanguage,
    categorySlugs,
    themes,
    ageRating: null,
    publicationEra,
    publicationYear,
    summary: { en, vi },
  };
}

function createEdition(
  work: WorkSeed,
  bookWork: BookWork,
  index: number,
  language: EditionLanguage,
): BookEdition {
  const isEnglish = language === "en";
  const format = selectFormat(index);
  const basePrice = 89_000 + (index % 8) * 12_000 + (format === "hardcover" ? 55_000 : 0);
  const priceVnd = isEnglish ? basePrice + 18_000 : basePrice;
  const stockQuantity = 8 + ((index * (isEnglish ? 5 : 7)) % 44);

  return bookEditionSchema.parse({
    id: stableUuid(isEnglish ? 3_000 + index : 4_000 + index),
    workId: bookWork.id,
    slug: `${work.slug}-${isEnglish ? "english" : "vietnamese"}-${format}`,
    displayTitle: isEnglish ? work.title : work.viTitle,
    localizedDisplayTitle: { en: work.title, vi: work.viTitle },
    subtitle: null,
    language,
    format,
    translatorIds: [],
    publisherId: demoPublisherId,
    isbn13: null,
    isbn10: null,
    publicationYear: work.publicationYear,
    pageCount: null,
    dimensions: format === "hardcover"
      ? { widthMm: 145, heightMm: 215, thicknessMm: null }
      : { widthMm: 130, heightMm: 205, thicknessMm: null },
    weightGrams: format === "hardcover" ? 520 : 360,
    coverImageId: placeholderCoverAssetId,
    priceVnd,
    compareAtPriceVnd: index % 6 === 0 ? priceVnd + 25_000 : null,
    stockQuantity,
    lowStockThreshold: 5,
    inventoryStatus: stockQuantity <= 10 ? "low-stock" : "in-stock",
    summary: editionSummary(work.summary, language),
    tableOfContents: null,
    sampleExcerptPolicy: "No commercial excerpt is stored in seed data; use short internal preview copy only.",
    isFeatured: index < 12 && isEnglish,
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  });
}

function editionSummary(summary: LocalizedText, language: EditionLanguage): LocalizedText {
  if (language === "en") {
    return {
      en: `${summary.en} This English edition is positioned for bilingual readers and classroom-friendly browsing.`,
      vi: `${summary.vi} An ban tieng Anh phu hop cho doc gia song ngu va nhu cau doc hoc thuat.`,
    };
  }

  return {
    en: `${summary.en} This Vietnamese edition is positioned for local discovery and step-by-step comparison with the English edition.`,
    vi: `${summary.vi} An ban tieng Viet phu hop cho doc gia trong nuoc va viec so sanh song song voi ban tieng Anh.`,
  };
}

function selectFormat(index: number): BookFormat {
  if (index % 17 === 0) return "special-edition";
  if (index % 10 === 0) return "hardcover";
  return "paperback";
}

function stableUuid(value: number): string {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

function countBy<T, K extends string>(items: T[], selector: (item: T) => K): Record<K, number> {
  return items.reduce<Record<K, number>>((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {} as Record<K, number>);
}

function assertSeedQuality() {
  if (bookWorks.length !== 50) {
    throw new Error(`Expected 50 works, received ${bookWorks.length}`);
  }
  if (bookEditions.length !== 100) {
    throw new Error(`Expected 100 editions, received ${bookEditions.length}`);
  }
  if (caseflowBooksSeedSummary.languageCounts.en !== 50) {
    throw new Error("Expected 50 English editions");
  }
  if (caseflowBooksSeedSummary.languageCounts.vi !== 50) {
    throw new Error("Expected 50 Vietnamese editions");
  }
  for (const edition of bookEditions) {
    if (edition.summary.en.length > 1_200 || edition.summary.vi.length > 1_200) {
      throw new Error(`Edition summary is too long: ${edition.slug}`);
    }
  }
}
