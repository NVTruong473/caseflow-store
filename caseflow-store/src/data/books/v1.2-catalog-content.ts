export type CanonicalVietnameseWorkContent = {
  title: string;
  summary: string;
};

export const canonicalVietnameseContentByWorkSlug: Record<
  string,
  CanonicalVietnameseWorkContent
> = {
  "pride-and-prejudice": {
    title: "Kiêu hãnh và định kiến",
    summary:
      "Một tiểu thuyết xã hội sắc sảo về phán đoán, áp lực gia đình và cái giá của việc nhầm ấn tượng ban đầu với sự thật.",
  },
  "jane-eyre": {
    title: "Jane Eyre",
    summary:
      "Một nữ gia sư kiên cường bảo vệ lương tâm trong hành trình tìm kiếm phẩm giá, tình yêu và nơi mình có thể sống chân thật.",
  },
  "wuthering-heights": {
    title: "Đồi gió hú",
    summary:
      "Câu chuyện dữ dội về tình yêu, kiêu hãnh và báo thù, nơi vết thương của một gia đình kéo thành giông bão qua nhiều thế hệ.",
  },
  "great-expectations": {
    title: "Những kỳ vọng lớn lao",
    summary:
      "Hành trình đổi đời của một chàng trai phơi bày cách tham vọng, xấu hổ và sự ngưỡng mộ lầm chỗ làm méo mó ý niệm thành công.",
  },
  "oliver-twist": {
    title: "Oliver Twist",
    summary:
      "Một cậu bé mồ côi đi qua thiếu thốn và hiểm nguy, trong khi thành phố bộc lộ cả sự tàn nhẫn lẫn lòng tốt bất ngờ.",
  },
  "a-tale-of-two-cities": {
    title: "Hai kinh thành",
    summary:
      "Bi kịch về cách mạng và hy sinh, kết nối lòng trung thành riêng tư với bạo lực của lịch sử công cộng.",
  },
  "moby-dick": {
    title: "Moby-Dick - Cá voi trắng",
    summary:
      "Một chuyến đi biển mở thành suy ngẫm lớn về ám ảnh, quyền lực, thiên nhiên và giới hạn kiểm soát của con người.",
  },
  "little-women": {
    title: "Những người phụ nữ bé nhỏ",
    summary:
      "Bốn chị em trưởng thành qua lao động, tình bạn, thất vọng và sự chăm sóc, mỗi người tự định nghĩa một cách lớn lên riêng.",
  },
  "the-adventures-of-sherlock-holmes": {
    title: "Những cuộc phiêu lưu của Sherlock Holmes",
    summary:
      "Tập truyện trinh thám dựa trên quan sát, suy luận và niềm vui khi những khuôn mẫu ẩn giấu dần lộ diện.",
  },
  dracula: {
    title: "Bá tước Dracula",
    summary:
      "Cuộc truy đuổi đậm chất gothic được kể qua thư từ và nhật ký, nơi nỗi sợ lan theo hành trình, lời đồn và điều chưa biết.",
  },
  frankenstein: {
    title: "Frankenstein",
    summary:
      "Tham vọng sáng tạo biến thành cuộc đối diện đạo đức về cô độc, trách nhiệm và điều làm nên một con người.",
  },
  "the-picture-of-dorian-gray": {
    title: "Chân dung Dorian Gray",
    summary:
      "Câu chuyện đạo đức về cái đẹp, ảnh hưởng và cái giá ẩn giấu của việc xem đời sống như nghệ thuật không có lương tâm.",
  },
  "the-count-of-monte-cristo": {
    title: "Bá tước Monte Cristo",
    summary:
      "Thiên truyện báo thù nơi kiên nhẫn, tiền bạc và mưu lược thử thách ranh giới giữa công lý và thù hận.",
  },
  "les-miserables": {
    title: "Những người khốn khổ",
    summary:
      "Bức tranh nhân sinh rộng lớn về luật pháp, lòng thương, nghèo khó và khả năng đổi mới đạo đức sau lỗi lầm.",
  },
  "the-three-musketeers": {
    title: "Ba chàng lính ngự lâm",
    summary:
      "Cuộc phiêu lưu nhanh về lòng trung thành, ganh đua và hiểm nguy chính trị, đặt tình bạn dưới sức ép.",
  },
  "around-the-world-in-eighty-days": {
    title: "Vòng quanh thế giới trong 80 ngày",
    summary:
      "Cuộc đua vòng quanh địa cầu biến sự đúng giờ, tiền bạc và tự tin thành phép thử vui nhộn của giao thông hiện đại.",
  },
  "journey-to-the-center-of-the-earth": {
    title: "Hành trình vào tâm Trái Đất",
    summary:
      "Một chuyến thám hiểm khoa học trở thành hành trình giàu tưởng tượng về rủi ro, tò mò và niềm hứng khởi khám phá.",
  },
  "the-time-machine": {
    title: "Cỗ máy thời gian",
    summary:
      "Chuyến đi tới tương lai xa biến suy tưởng khoa học thành lời cảnh báo về tiện nghi, bất bình đẳng và suy thoái.",
  },
  "the-war-of-the-worlds": {
    title: "Chiến tranh giữa các thế giới",
    summary:
      "Câu chuyện xâm lăng khiến phố phường quen thuộc trở nên mong manh trước một sức mạnh vượt ngoài mọi chuẩn bị của con người.",
  },
  "alice-in-wonderland": {
    title: "Cuộc phiêu lưu của Alice ở xứ sở thần tiên",
    summary:
      "Truyện kỳ ảo vui nhộn nơi trí tò mò của một cô bé gặp những quy tắc uốn cong, đổ vỡ và biến ngôn ngữ thành trò chơi.",
  },
  "the-wonderful-wizard-of-oz": {
    title: "Phù thủy xứ Oz",
    summary:
      "Hành trình rực rỡ về mái nhà, lòng can đảm, trí tuệ và những người bạn giúp các phẩm chất ấy hiện rõ.",
  },
  "the-secret-garden": {
    title: "Khu vườn bí mật",
    summary:
      "Một đứa trẻ cô đơn nhận ra sự chăm sóc, khí trời và những việc nhỏ mỗi ngày có thể hồi sinh cả khu vườn lẫn con người.",
  },
  "anne-of-green-gables": {
    title: "Anne tóc đỏ dưới chái nhà xanh",
    summary:
      "Một cô bé mồ côi giàu tưởng tượng tìm thấy nơi thuộc về khi lỗi lầm, hy vọng và lời nói của em làm đổi thay một gia đình yên tĩnh.",
  },
  "treasure-island": {
    title: "Đảo giấu vàng",
    summary:
      "Cuộc săn kho báu đầy những lòng trung thành đổi hướng, nơi phiêu lưu dạy sự thận trọng không kém lòng can đảm.",
  },
  "the-call-of-the-wild": {
    title: "Tiếng gọi nơi hoang dã",
    summary:
      "Câu chuyện sinh tồn về bản năng, thích nghi và sức hút của một đời sống khắc nghiệt bên ngoài tiện nghi thuần hóa.",
  },
  "the-jungle-book": {
    title: "Sách rừng xanh",
    summary:
      "Những câu chuyện liên kết về muông thú khám phá cảm giác thuộc về, kỷ luật và các quy tắc giữ một cộng đồng bền vững.",
  },
  "the-wind-in-the-willows": {
    title: "Gió qua rặng liễu",
    summary:
      "Câu chuyện dịu dàng bên bờ sông về tình bạn, sự bồn chồn, mái nhà và những rắc rối hài hước do tính tự phụ.",
  },
  "a-christmas-carol": {
    title: "Bài ca Giáng sinh",
    summary:
      "Câu chuyện đạo đức cô đọng nơi ký ức và tưởng tượng thúc đẩy một người keo kiệt hướng tới rộng lượng và sửa sai.",
  },
  "the-adventures-of-tom-sawyer": {
    title: "Những cuộc phiêu lưu của Tom Sawyer",
    summary:
      "Câu chuyện tuổi thơ sinh động nơi trò chơi, nỗi sợ và lương tâm gặp nhau bên dòng sông và phố thị trấn.",
  },
  "adventures-of-huckleberry-finn": {
    title: "Những cuộc phiêu lưu của Huckleberry Finn",
    summary:
      "Chuyến đi trên sông buộc người kể chuyện trẻ tuổi cân nhắc tình bạn, tự do và những chuẩn mực đạo đức đã được dạy.",
  },
  "the-brothers-karamazov": {
    title: "Anh em nhà Karamazov",
    summary:
      "Bi kịch gia đình mở rộng thành những câu hỏi về đức tin, tự do, tội lỗi và trách nhiệm trước người khác.",
  },
  "crime-and-punishment": {
    title: "Tội ác và hình phạt",
    summary:
      "Tiểu thuyết tâm lý về một tội ác, sức ép của mặc cảm và nhu cầu đau đớn phải đối diện với sự phán xét đạo đức.",
  },
  "anna-karenina": {
    title: "Anna Karenina",
    summary:
      "Tiểu thuyết xã hội rộng lớn nơi khát vọng riêng va chạm với gia đình, danh tiếng và hành trình tìm kiếm ý nghĩa.",
  },
  "war-and-peace": {
    title: "Chiến tranh và hòa bình",
    summary:
      "Bức tranh bao quát về gia đình và chiến tranh, đặt câu hỏi đời sống riêng vận động thế nào giữa những lực đẩy lịch sử lớn.",
  },
  "the-metamorphosis": {
    title: "Hóa thân",
    summary:
      "Một biến đổi kỳ lạ phơi bày sự mong manh của nghĩa vụ, tình thân và vị trí của một con người trong gia đình.",
  },
  siddhartha: {
    title: "Siddhartha",
    summary:
      "Hành trình tinh thần theo chân một người tìm đạo, người dần hiểu rằng trí tuệ không thể chỉ vay mượn từ thầy dạy.",
  },
  "the-prophet": {
    title: "Nhà tiên tri",
    summary:
      "Tập suy ngẫm giàu chất thơ về tình yêu, công việc, tự do, mất mát và những sợi dây tạo nên cộng đồng.",
  },
  "the-art-of-war": {
    title: "Binh pháp Tôn Tử",
    summary:
      "Văn bản chiến lược cô đọng xem xung đột là vấn đề của chuẩn bị, thời điểm, tiết chế và phán đoán sáng suốt.",
  },
  meditations: {
    title: "Suy tưởng",
    summary:
      "Những suy ngẫm riêng về kỷ luật, bổn phận, cái chết và việc rèn luyện mỗi ngày để giữ phán đoán vững vàng.",
  },
  "tao-te-ching": {
    title: "Đạo Đức Kinh",
    summary:
      "Văn bản triết học cô đọng đề cao sự giản dị, mềm dẻo, tiết chế và hành động không cưỡng ép.",
  },
  "the-republic": {
    title: "Cộng hòa",
    summary:
      "Cuộc đối thoại triết học về công lý, giáo dục, quyền lực và cấu trúc của một thành bang được tổ chức tốt.",
  },
  "don-quixote": {
    title: "Don Quixote",
    summary:
      "Hành trình hài hước nơi những chuyện hiệp sĩ xưa va chạm với thực tế đời thường và trí tưởng tượng bền bỉ.",
  },
  "the-divine-comedy": {
    title: "Thần khúc",
    summary:
      "Hành trình thị kiến qua những cảnh giới đạo đức, biến lưu đày, phán xét và hy vọng thành thi ca.",
  },
  "the-iliad": {
    title: "Iliad",
    summary:
      "Sử thi về chiến tranh và cơn giận, khảo sát danh dự, đau thương và cái giá con người của danh tiếng anh hùng.",
  },
  "the-odyssey": {
    title: "Odyssey",
    summary:
      "Sử thi trở về nơi sức bền, mưu trí, ký ức và lòng thủy chung quan trọng không kém sức mạnh.",
  },
  "grimms-fairy-tales": {
    title: "Truyện cổ Grimm",
    summary:
      "Tập truyện dân gian với những thử thách, giao kèo và biến hóa kỳ lạ vẫn định hình cách kể chuyện cho trẻ em.",
  },
  "andersens-fairy-tales": {
    title: "Truyện cổ Andersen",
    summary:
      "Tập cổ tích văn học nơi điều kỳ diệu thường đi cùng sự dịu dàng, nỗi buồn và sự quan tâm đạo đức.",
  },
  "aesops-fables": {
    title: "Ngụ ngôn Aesop",
    summary:
      "Những truyện ngụ ngôn ngắn dùng tình huống dễ nhớ để rèn phán đoán thực tế về kiêu hãnh, niềm tin và hệ quả.",
  },
  "the-wealth-of-nations": {
    title: "Sự thịnh vượng của các quốc gia",
    summary:
      "Tác phẩm kinh tế nền tảng về lao động, thị trường, động lực và cách đời sống thương mại được tổ chức.",
  },
  "the-old-man-and-the-sea": {
    title: "Ông già và biển cả",
    summary:
      "Cuộc vật lộn đơn độc ngoài khơi của một lão ngư trở thành suy ngẫm cô đọng về sức bền, tay nghề, phẩm giá và mất mát.",
  },
};
