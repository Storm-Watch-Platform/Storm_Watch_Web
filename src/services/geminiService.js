// Gemini API Service for Image Analysis
// Using Google Gemini 3 Pro Preview model for image analysis

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent";

/**
 * Convert File to base64 string
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 string (without data:image/... prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data:image/...;base64, prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze image using Google Gemini API
 * @param {File} file - Image file
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeImageWithGemini(file) {
  if (!GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY chưa được cấu hình trong file .env");
  }

  try {
    console.log("🔍 [Gemini] Starting image analysis...");

    // Convert file to base64
    const base64Image = await fileToBase64(file);
    console.log(
      "✅ [Gemini] Image converted to base64, size:",
      base64Image.length,
      "chars"
    );

    // Prepare prompt for Gemini
    const prompt = `Bạn là chuyên gia phân tích hình ảnh về thiên tai, bão lũ, và tình huống khẩn cấp. 

Hãy phân tích hình ảnh này và xác định vấn đề liên quan đến:
- Thiên tai (mưa lớn, gió mạnh, lũ quét, sạt lở đất, sương mù, nhiệt độ cực đoan)
- Hạ tầng và giao thông (đường sạt lở, cầu hư hỏng, đường ngập nước, cây đổ, điện/nước bị cắt)
- Hậu cần và sinh tồn (thiếu lương thực, nước sạch, thuốc men, nhiên liệu, chợ/siêu thị đóng cửa, dịch vụ y tế không hoạt động)
- An toàn và sức khỏe (ô nhiễm không khí/nước, dịch bệnh, động vật nguy hiểm, khu vực không an toàn, thiếu thiết bị y tế)

Hãy trả về kết quả dưới dạng JSON với format sau (CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC):
{
  "detected": [
    {
      "label": "Mô tả ngắn gọn vấn đề bằng tiếng Việt (ví dụ: 'Nước ngập đường', 'Cây đổ chặn đường', 'Mưa lớn')",
      "confidence": 0.85,
      "category": "weather-nature"
    }
  ],
  "suggested_category": "weather-nature",
  "confidence": 0.85,
  "description": "Mô tả chi tiết bằng tiếng Việt về những gì bạn thấy trong ảnh"
}

Các category có thể là:
- "weather-nature": Thời tiết và thiên nhiên
- "infrastructure-traffic": Hạ tầng và giao thông  
- "logistics-survival": Hậu cần và sinh tồn
- "safety-health": An toàn và sức khỏe

Nếu không phát hiện vấn đề gì, trả về category "weather-nature" với confidence thấp.

CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN, KHÔNG CÓ TEXT GIẢI THÍCH.`;

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: file.type || "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ [Gemini] API error response:", errorData);
      throw new Error(
        `Gemini API error: ${response.status} - ${
          errorData.error?.message || JSON.stringify(errorData)
        }`
      );
    }

    const data = await response.json();
    console.log("✅ [Gemini] API response received");

    // Extract text from Gemini response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!textResponse) {
      throw new Error("Gemini API không trả về kết quả");
    }

    // Try to parse JSON from response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = textResponse;

      // Try to extract from ```json ... ```
      const jsonBlockMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1];
      } else {
        // Try to extract from ``` ... ```
        const codeBlockMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1];
        } else {
          // Try to find JSON object in text
          const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            jsonText = jsonObjectMatch[0];
          }
        }
      }

      analysisResult = JSON.parse(jsonText.trim());

      // Validate result structure
      if (!analysisResult.detected || !Array.isArray(analysisResult.detected)) {
        throw new Error("Invalid response structure: missing detected array");
      }

      // Ensure suggested_category is valid
      const validCategories = [
        "weather-nature",
        "infrastructure-traffic",
        "logistics-survival",
        "safety-health",
      ];
      if (!validCategories.includes(analysisResult.suggested_category)) {
        analysisResult.suggested_category = "weather-nature";
      }
    } catch (parseError) {
      console.warn("⚠️ [Gemini] Failed to parse response as JSON:", parseError);
      console.warn("⚠️ [Gemini] Raw response:", textResponse);

      // Fallback: create basic analysis from text
      analysisResult = {
        detected: [
          {
            label:
              textResponse.substring(0, 100) || "Đã phát hiện vấn đề trong ảnh",
            confidence: 0.7,
            category: "weather-nature",
          },
        ],
        suggested_category: "weather-nature",
        confidence: 0.7,
        description: textResponse.substring(0, 500),
      };
    }

    console.log("✅ [Gemini] Image analysis completed:", analysisResult);
    return analysisResult;
  } catch (error) {
    console.error("❌ [Gemini] Error analyzing image:", error);
    throw error;
  }
}

/**
 * Check if Gemini API is available
 * @returns {boolean}
 */
export function isGeminiAvailable() {
  return !!GEMINI_API_KEY;
}

/**
 * Get Gemini API rate limit information
 * @returns {Object} Rate limit info
 */
export function getGeminiRateLimitInfo() {
  // Gemini 3 Pro Preview:
  // - Input token limit: 1,048,576 tokens
  // - Output token limit: 65,536 tokens
  // - Supports: Text, Image, Video, Audio, PDF
  // - Free tier limits may vary, check Google Cloud Console for current limits
  //
  // Note: Rate limits depend on your Google Cloud billing tier
  // Free tier typically: 15 RPM, 1,000 RPD
  // Paid tier: Higher limits based on pricing

  return {
    model: "gemini-3-pro-preview",
    freeTier: {
      requestsPerMinute: 15,
      requestsPerDay: 1000,
      note: "Giới hạn miễn phí: 1,000 ảnh/ngày, 15 ảnh/phút (có thể thay đổi)",
    },
    paidTier: {
      note: "Gói trả phí có giới hạn cao hơn tùy theo gói",
    },
    capabilities: {
      inputTokens: "1,048,576 tokens",
      outputTokens: "65,536 tokens",
      supports: "Text, Image, Video, Audio, PDF",
    },
  };
}
