import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;   // 👈 add this line
  image: string;
  author: string;
  authorImage: string;
  date: string;
  readTime: string;
  category: string;
  likes: number;
  location: string;
  tags: string[];
}

@Component({
  selector: "app-blog",
  templateUrl: "./blog.component.html",
  styleUrls: ["./blog.component.css"],
})
export class BlogComponent implements OnInit {
  selectedCategory: string = "All";
  currentFeaturedIndex: number = 0;

  categories = ["All", "Adventure", "Culture", "Food", "Tips", "Nature"];

  blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "Hidden Gems of Kerala: Beyond the Backwaters",
      excerpt:
        "Discover the untold stories and secret locations that make Kerala a paradise for adventurous travelers.",
      content: "Kerala, known as 'God's Own Country'...",
      image:
        "https://images.pexels.com/photos/169647/pexels-photo-169647.jpeg?auto=compress&cs=tinysrgb&w=800",
      author: "Priya Sharma",
      authorImage: "https://i.pravatar.cc/100?img=12",
      date: "2025-09-10",
      readTime: "8 min read",
      category: "Culture",
      likes: 124,
      location: "Kerala, India",
      tags: ["Kerala", "Culture", "Hidden Gems", "Travel Tips"],
    },
    {
      id: 2,
      title: "Street Food Adventures in Old Delhi",
      excerpt: "A culinary journey through the narrow lanes of Chandni Chowk.",
      content:
        "The bustling streets of Old Delhi are a food lover's paradise...",
      image:
        "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800",
      author: "Rajesh Kumar",
      authorImage: "https://i.pravatar.cc/100?img=15",
      date: "2025-09-08",
      readTime: "6 min read",
      category: "Food",
      likes: 89,
      location: "Delhi, India",
      tags: ["Delhi", "Street Food", "Culture", "Photography"],
    },
    {
      id: 3,
      title: "Trekking the Himalayas: A Beginner's Guide",
      excerpt: "Essential tips and insights for first-time trekkers.",
      content:
        "The Himalayas offer some of the world's most breathtaking trekking experiences...",
      image:
        "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg?auto=compress&cs=tinysrgb&w=800",
      author: "Amit Singh",
      authorImage: "https://i.pravatar.cc/100?img=7",
      date: "2025-09-05",
      readTime: "12 min read",
      category: "Adventure",
      likes: 203,
      location: "Himalayas, India",
      tags: ["Himalaya", "Trekking", "Adventure", "Mountains"],
    },
    {
      id: 4,
      title: "Temple Architecture of Tamil Nadu",
      excerpt:
        "Exploring the intricate art and spiritual significance of South India's temples.",
      content:
        "Tamil Nadu's temples are masterpieces of Dravidian architecture...",
      image:
        "https://images.pexels.com/photos/2086753/pexels-photo-2086753.jpeg?auto=compress&cs=tinysrgb&w=800",
      author: "Lakshmi Iyer",
      authorImage: "https://i.pravatar.cc/100?img=8",
      date: "2025-09-03",
      readTime: "10 min read",
      category: "Culture",
      likes: 156,
      location: "Tamil Nadu, India",
      tags: ["Tamil Nadu", "Temples", "Architecture", "History"],
    },
    {
      id: 5,
      title: "Budget Travel Tips for India",
      excerpt: "How to explore India without breaking the bank.",
      content:
        "Traveling in India on a budget doesn’t mean compromising on experiences...",
      image:
        "https://images.pexels.com/photos/163185/travel-map-trip-tourism-163185.jpeg?auto=compress&cs=tinysrgb&w=800",
      author: "Sarah Johnson",
      authorImage: "https://i.pravatar.cc/100?img=32",
      date: "2025-09-01",
      readTime: "7 min read",
      category: "Tips",
      likes: 267,
      location: "India",
      tags: ["Budget Travel", "Tips", "Backpacking", "India"],
    },
    {
      id: 6,
      title: "Amazon Rainforest: A Journey into the Wild",
      excerpt: "Experience the raw beauty and biodiversity of the Amazon.",
      content:
        "The Amazon rainforest is home to countless species and untouched natural wonders...",
      image:
        "https://images.pexels.com/photos/325807/pexels-photo-325807.jpeg?auto=compress&cs=tinysrgb&w=800",
      author: "Carlos Mendes",
      authorImage: "https://i.pravatar.cc/100?img=21",
      date: "2025-08-28",
      readTime: "15 min read",
      category: "Nature",
      likes: 312,
      location: "Amazon, Brazil",
      tags: ["Amazon", "Rainforest", "Wildlife", "Nature"],
    },
  ];

  featuredPosts: BlogPost[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadImages();

    // Auto-rotate carousel every 5 seconds
    setInterval(() => {
      this.nextFeatured();
    }, 5000);
  }

  loadImages() {
    const API_URL = "https://api.pexels.com/v1/search";
    const headers = new HttpHeaders({
      Authorization: "lziGnbzjpGpnwAGAu1KYKuJghDSuOVfworDozfcEESqesyoebEOalcTq",
    });

    // Featured images
    this.http
      .get<any>(API_URL, {
        headers,
        params: { query: "india travel", per_page: 3 },
      })
      .subscribe((res) => {
        this.featuredPosts = this.blogPosts.slice(0, 3).map((post, i) => ({
          ...post,
          image:
            res.photos[i]?.src.large || "https://via.placeholder.com/800x600",
        }));
      });

    // Blog images
    this.http
      .get<any>(API_URL, {
        headers,
        params: {
          query: "indian adventure culture",
          per_page: this.blogPosts.length,
        },
      })
      .subscribe((res) => {
        this.blogPosts = this.blogPosts.map((post, i) => ({
          ...post,
          image:
            res.photos[i]?.src.medium || "https://via.placeholder.com/600x400",
        }));
      });
  }

  get filteredPosts() {
    return this.selectedCategory === "All"
      ? this.blogPosts
      : this.blogPosts.filter((p) => p.category === this.selectedCategory);
  }

  setCategory(category: string) {
    this.selectedCategory = category;
  }

  nextFeatured() {
    this.currentFeaturedIndex =
      (this.currentFeaturedIndex + 1) % this.featuredPosts.length;
  }

  prevFeatured() {
    this.currentFeaturedIndex =
      (this.currentFeaturedIndex - 1 + this.featuredPosts.length) %
      this.featuredPosts.length;
  }
}
