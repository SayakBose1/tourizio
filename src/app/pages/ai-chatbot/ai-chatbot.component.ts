import {
  Component,
  AfterViewChecked,
  ElementRef,
  ViewChild,
} from '@angular/core';

declare const puter: any; 

interface Message {
  user: 'You' | 'AI';
  text: string;
}

@Component({
  selector: 'app-ai-chatbot',
  templateUrl: './ai-chatbot.component.html',
})
export class AiChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  isTyping = false;
  userInput = '';
  messages: Message[] = [];
  quickReplies = ['Destinations', 'Rides', 'Hotels', 'Packages'];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage(input?: string) {
    const question = input ?? this.userInput.trim();
    if (!question) return;

    this.messages.push({ user: 'You', text: question });
    this.userInput = '';
    this.isTyping = true;
    this.scrollToBottom(true);

    const context = `
App Name: Tourizio

Purpose:
Tourizio is a tourism information and booking web app that helps users explore, plan, and book their travel.

Features:
- Explore destinations across different states of India.
- Get detailed descriptions, ratings, and reviews of each destination.
- View exact locations on a responsive map.
- Filter destinations by popularity, price, and type.
- Instant booking with secure payments.
- User authentication and profile management.
- Personalized recommendations based on user preferences.
- My bookings section to view and manage my trips.
- 24/7 AI chat assistant for user support.

Rules for AI:
1. Only answer based on Tourizio’s features, content, and travel-related topics.
2. If asked something unrelated, reply exactly: "I can only answer questions about the Tourizio app."
3. Be concise, friendly, and professional.
4. If asked for recommendations, mention realistic Indian destinations (like Goa, Jaipur, Kerala) or Tourizio packages.
5. Never reveal you are an AI or mention Puter.js.
6. Answer in a way that encourages users to explore and book through Tourizio.
7. Answer fast and accurately.
`;

    try {
      // Optional small delay to show typing animation
      await new Promise((r) => setTimeout(r, 300));

      // Ask Puter.js for answer
      const answer: string = await puter.ai.chat(
        `${context}\nUser: ${question}`,
        {
          model: 'gpt-5-mini',
        },
      );

      this.messages.push({ user: 'AI', text: answer });
    } catch (err) {
      console.error(err);
      this.messages.push({ user: 'AI', text: 'Oops! Something went wrong.' });
    } finally {
      this.isTyping = false;
      this.scrollToBottom(true);
    }
  }

  scrollToBottom(force: boolean = false) {
    setTimeout(() => {
      if (!this.messagesContainer?.nativeElement) return;
      const container = this.messagesContainer.nativeElement;
      if (force) {
        container.scrollTop = container.scrollHeight;
      } else {
        const distanceToBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceToBottom < 100) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }, 50);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  selectQuickReply(reply: string) {
    this.sendMessage(reply);
  }
}
