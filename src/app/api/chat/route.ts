import { NextRequest, NextResponse } from 'next/server';

// 从环境变量获取API密钥，如果没有则使用提供的密钥
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-6ddb6b3bfde140b28d91885d07d4857a';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '无效的消息格式' },
        { status: 400 }
      );
    }

    // 验证API密钥
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-api-key-here') {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      );
    }

    // 添加系统提示，让AI更好地理解它的角色
    const systemMessage: Message = {
      role: 'system',
      content: '你是SheldonChat，一个智能聊天助手。请用中文回答用户的问题，并尽可能提供有用、准确的信息。你可以使用Markdown格式来让回答更清晰易读。请保持友好、专业的语调。'
    };

    // 构建发送给DeepSeek的消息数组
    const apiMessages = [systemMessage, ...messages];

    console.log('发送到DeepSeek API的消息:', JSON.stringify(apiMessages, null, 2));

    // 调用DeepSeek API
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    console.log('DeepSeek API响应状态:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API错误:', errorData);
      
      // 根据不同的错误状态码返回不同的错误信息
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API密钥无效，请检查配置' },
          { status: 500 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: '请求过于频繁，请稍后重试' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: 'AI服务暂时不可用，请稍后重试' },
          { status: 500 }
        );
      }
    }

    const data = await response.json();
    console.log('DeepSeek API响应数据:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('DeepSeek API响应格式错误:', data);
      return NextResponse.json(
        { error: 'AI响应格式错误' },
        { status: 500 }
      );
    }

    const aiMessage = data.choices[0].message.content;

    return NextResponse.json({
      message: aiMessage,
      usage: data.usage,
    });

  } catch (error) {
    console.error('聊天API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
} 