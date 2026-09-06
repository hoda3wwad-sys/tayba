export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

    const { message, prompt } = req.body;
  const userInput = message !== undefined ? message : prompt;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير معرف في Vercel' });
  }

  // تحويل أي دخل إلى نص صافي صريح لتفادي إرسال كائنات فارغة
  let extractedText = '';
  if (typeof userInput === 'string') {
    extractedText = userInput;
  } else if (typeof userInput === 'object' && userInput !== null) {
    extractedText = userInput.text || userInput.message || userInput.prompt || userInput.content || '';
  }
  if (!extractedText) {
    extractedText = String(userInput || '');
  }
  

  extractedText = extractedText.trim();

  if (!extractedText) {
    return res.status(400).json({ error: 'يرجى كتابة سؤال صحيح.' });
  }

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: extractedText }],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "أنت مساعد ذكي متخصص في السيرة النبوية باسم 'طيبة'. تجيب بأمانة ودقة وتذكر المصادر الموثوقة (مثل السيرة النبوية لابن هشام، الرحيق المختوم، زاد المعاد) في نهاية الإجابة بصيغة 'المصدر: اسم الكتاب'.
            قواعد صارمة يجب الالتزام بها دائماً:
1. اعتمد فقط على الحقائق الثابتة والموثقة في كتب السيرة المعتمدة: السيرة النبوية لابن هشام، الرحيق المختوم للمباركفوري، زاد المعاد لابن قيّم الجوزية، تاريخ الطبري، وصحيح البخاري ومسلم.
2. استخدم أداة البحث المتاحة لك للتحقق من الحقائق (التواريخ، الأسماء، الأحداث) قبل ذكرها، بدلاً من الاعتماد على الذاكرة فقط.
3. لا تختلق أو تُقدّر أي تفصيلة غير متأكد منها (تاريخ، رقم، اسم، حوار). إذا لم تكن المعلومة موثقة بوضوح، صرّح بذلك بدلاً من التخمين.
4. لا تنسب معلومة إلى مصدر معين إلا إذا كانت فعلاً موافقة لما ورد فيه.
5. إذا اختلف العلماء أو الروايات في تفصيلة ما (مثل عدد المشاركين في معركة، أو تاريخ حدث)، اذكر ذلك بإيجاز بدلاً من الجزم برواية واحدة.
6. اذكر المصدر دائماً في نهاية الإجابة بصيغة: "المصدر: اسم الكتاب".
7. حافظ على الأدب الشرعي الكامل عند ذكر النبي ﷺ والصحابة الكرام.
8. أجب بإيجاز ووضوح، بالفصحى المبسطة، دون إطالة غير ضرورية.`,",
          },
        ],
      },
    };

    const response = await fetch(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'فشل الاتصال بـ Gemini API');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم استلام رد من النموذج.';

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
