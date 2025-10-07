import {
  Component,
  AfterViewChecked,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';

declare const puter: any;

interface Message {
  user: 'You' | 'AI';
  text: string;
  image?: string;
  suggestions?: string[];
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
  quickReplies = [
    'Popular Destinations',
    'Beach Getaways',
    'Hill Stations',
    'Budget Travel Tips',
  ];

  private shouldAutoScroll = true;
  private lastMessageCount = 0;

  private readonly UNSPLASH_ACCESS_KEY =
    'GWcrtu8_uHrAmheYYvHYZSlVZoIFNGU1vTLMYHC0tOI';
  private readonly UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

  private readonly destinationKeywords = [
    'goa',
    'kerala',
    'jaipur',
    'udaipur',
    'mumbai',
    'delhi',
    'chennai',
    'kolkata',
    'bangalore',
    'shimla',
    'manali',
    'ladakh',
    'kashmir',
    'andaman',
    'lakshadweep',
    'varanasi',
    'agra',
    'taj mahal',
    'rajasthan',
    'hampi',
    'mysore',
    'darjeeling',
    'ooty',
    'munnar',
    'coorg',
    'pondicherry',
    'gokarna',
    'rishikesh',
    'haridwar',
    'amritsar',
    'golden temple',
    'beach',
    'mountain',
    'hill station',
    'temple',
    'palace',
    'fort',
    'destination',
    'travel',
  ];

  constructor(private router: Router) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage(input?: string) {
    const question = input ?? this.userInput.trim();
    if (!question) return;

    this.messages.push({ user: 'You', text: question });
    this.userInput = '';
    this.isTyping = true;
    this.shouldAutoScroll = true;
    this.scrollToBottom(true);

    const context = `You are Tourizio AI Assistant - an intelligent travel companion.

TOURIZIO APP FEATURES:
- Explore 100+ destinations across India with ratings, reviews & prices
- Interactive maps showing exact locations
- Smart filters (popularity, price, type: Adventure/Cultural/Food/Nature)
- Secure instant booking with payment gateway
- User profiles with booking history
- Personalized AI recommendations
- 24/7 customer support

PERSONALITY:
- Friendly, enthusiastic, and knowledgeable about Indian travel
- Provide specific, actionable advice
- Use emojis occasionally (but not excessively)
- Be conversational and warm

RESPONSE RULES:
1. For destination queries: Mention 2-3 specific places with brief highlights
2. For price queries: Give realistic price ranges (budget: ₹5k-10k, mid: ₹10k-20k, luxury: ₹20k+)
3. For "best time" questions: Specify months and weather conditions
4. For booking questions: Guide them to use Tourizio's booking feature
5. For off-topic questions: Politely redirect to travel topics
6. Keep responses under 150 words unless detailed explanation needed
7. Always encourage booking through Tourizio

EXAMPLE GOOD RESPONSES:
User: "Best beaches in India?"
AI: "🏖️ Here are my top picks:
1. **Goa** - Vibrant nightlife, water sports (Oct-Mar)
2. **Andaman** - Crystal clear waters, perfect for diving
3. **Gokarna** - Peaceful, less crowded alternative to Goa

All these are available on Tourizio with instant booking! Want me to help you plan?"

User: "Budget trip to Manali?"
AI: "Great choice! 🏔️ For a budget Manali trip:
- **₹8,000-12,000** for 3 days (includes stay, food, local transport)
- **Best time**: March-June or Oct-Nov
- **Must-do**: Solang Valley, Old Manali cafes

Check Tourizio for budget packages starting at ₹9,499! Should I show you our deals?"`;

    try {
      await new Promise((r) => setTimeout(r, 300));

      // Call the AI
      const response = await puter.ai.chat(`${context}\n\nUser: ${question}`, {
        model: 'gpt-5',
      });

      console.log('Raw AI response:', response);

      // Extract text safely
      const answer: string = response?.message?.content ?? '';

      if (!answer) {
        this.messages.push({
          user: 'AI',
          text: "⚠️ Sorry, I didn't get a proper response. Please try again.",
        });
        return;
      }

      const shouldFetchImage = this.shouldGenerateImage(question, answer);
      let imageUrl: string | undefined;
      let suggestions: string[] | undefined;

      if (shouldFetchImage) {
        const searchQuery = this.extractDestinationQuery(question, answer);
        imageUrl = await this.fetchDestinationImage(searchQuery);
        suggestions = this.generateSuggestions(answer);
      }

      this.messages.push({
        user: 'AI',
        text: answer,
        image: imageUrl,
        suggestions: suggestions,
      });
      this.shouldAutoScroll = true;
    } catch (err) {
      console.error('Error sending message:', err);
      this.messages.push({
        user: 'AI',
        text: "⚠️ Oops! I'm having trouble connecting. Please try again in a moment.",
      });
    } finally {
      this.isTyping = false;
      this.scrollToBottom(true);
    }
  }

  private shouldGenerateImage(question: string, answer: string): boolean {
    const combinedText = (question + ' ' + answer).toLowerCase();
    return this.destinationKeywords.some((keyword) =>
      combinedText.includes(keyword),
    );
  }

  private extractDestinationQuery(question: string, answer: string): string {
    const combinedText = question + ' ' + answer;
    const specificPlaces = [
      'goa beach',
      'kerala backwaters',
      'taj mahal',
      'jaipur palace',
      'manali',
      'ladakh',
      'andaman',
      'shimla',
      'udaipur',
      'varanasi',
      'golden temple',
      'hampi',
      'mysore palace',
      'darjeeling tea garden',
    ];

    for (const place of specificPlaces) {
      if (combinedText.toLowerCase().includes(place)) {
        return `${place} india tourism`;
      }
    }

    for (const keyword of this.destinationKeywords) {
      if (combinedText.toLowerCase().includes(keyword)) {
        return `${keyword} india travel destination`;
      }
    }

    return 'india tourism destination';
  }

  private async fetchDestinationImage(
    query: string,
  ): Promise<string | undefined> {
    try {
      const res = await fetch(
        `${this.UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${this.UNSPLASH_ACCESS_KEY}` } },
      );

      if (!res.ok) return undefined;
      const data = await res.json();
      if (!data.results?.length) return undefined;

      const scoredPhotos = data.results.map((photo: any) => {
        const description = (
          photo.description ||
          photo.alt_description ||
          ''
        ).toLowerCase();
        let score = 0;
        if (description.match(/people|person|man|woman|car|vehicle/))
          score -= 50;
        if (description.match(/landscape|temple|palace|beach|mountain|fort/))
          score += 30;
        return { photo, score };
      });

      scoredPhotos.sort((a, b) => b.score - a.score);
      return scoredPhotos[0].photo.urls.regular;
    } catch (err) {
      console.error('Image fetch failed:', err);
      return undefined;
    }
  }

  private generateSuggestions(answer: string): string[] {
    const suggestions: string[] = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('goa')) {
      suggestions.push(
        'Hotels in Goa',
        'Water sports packages',
        'Nightlife spots',
      );
    } else if (
      lowerAnswer.includes('manali') ||
      lowerAnswer.includes('shimla')
    ) {
      suggestions.push(
        'Adventure activities',
        'Honeymoon packages',
        'Best time to visit',
      );
    } else if (lowerAnswer.includes('kerala')) {
      suggestions.push(
        'Houseboat booking',
        'Ayurveda resorts',
        'Backwater tours',
      );
    } else if (
      lowerAnswer.includes('rajasthan') ||
      lowerAnswer.includes('jaipur')
    ) {
      suggestions.push('Palace tours', 'Desert safari', 'Heritage hotels');
    } else {
      suggestions.push('View all destinations', 'Check packages', 'Best deals');
    }

    return suggestions.slice(0, 3);
  }

  handleSuggestionClick(suggestion: string) {
    if (
      suggestion.includes('View all') ||
      suggestion.includes('destinations')
    ) {
      this.router.navigate(['/destinations']);
      this.toggleChat();
    } else {
      this.sendMessage(suggestion);
    }
  }

  scrollToBottom(force: boolean = false) {
    setTimeout(() => {
      if (!this.messagesContainer?.nativeElement) return;
      const container = this.messagesContainer.nativeElement;

      if (force) {
        container.scrollTop = container.scrollHeight;
      } else if (this.shouldAutoScroll) {
        const distanceToBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceToBottom < 150)
          container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  onScroll(event: any) {
    const container = event.target;
    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    this.shouldAutoScroll = distanceToBottom < 100;
  }

  ngAfterViewChecked() {
    if (this.messages.length !== this.lastMessageCount) {
      this.lastMessageCount = this.messages.length;
      this.scrollToBottom();
    }
  }

  selectQuickReply(reply: string) {
    this.sendMessage(reply);
  }
}
