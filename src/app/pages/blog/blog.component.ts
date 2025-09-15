import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  authorImage: string;
  date: string;
  readTime: string;
  category: string;
  likes: number;
  location: string;
  tags: string[];
  liked?: boolean;
  imageLoaded?: boolean; // ✅ new property for skeleton loader
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

  blogPosts: BlogPost[] = [];
  featuredPosts: BlogPost[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // ✅ Load posts from JSON instead of hardcoding
    this.http.get<any>("assets/data/blogs.json").subscribe((data) => {
      this.blogPosts = data.blogPosts.map((post: BlogPost) => ({
        ...post,
        image: "",          // start empty
        liked: false,       // default like state
        imageLoaded: false, // for skeleton
      }));

      this.featuredPosts = [...this.blogPosts];
      this.loadImages();
    });

    // Auto-rotate carousel every 5 seconds
    setInterval(() => this.nextFeatured(), 5000);
  }

  loadImages() {
    const API_URL = "https://api.pexels.com/v1/search";
    const headers = new HttpHeaders({
      Authorization: "lziGnbzjpGpnwAGAu1KYKuJghDSuOVfworDozfcEESqesyoebEOalcTq",
    });

    const queries: { [key: number]: string } = {
      1: "kerala famous location",
      2: "delhi street food",
      3: "himalaya trekking",
      4: "tamil nadu temples",
      5: "budget india",
      6: "amazon rainforest",
    };

    this.blogPosts.forEach((post, index) => {
      const query = queries[post.id] || "india travel";

      this.http
        .get<any>(API_URL, {
          headers,
          params: { query, per_page: 1 },
        })
        .subscribe((res) => {
          const newImage =
            res.photos[0]?.src.medium || "https://via.placeholder.com/600x400";
          this.blogPosts[index].image = newImage;
          // ✅ mark image as loaded after short delay for skeleton
          setTimeout(() => (this.blogPosts[index].imageLoaded = true), 50);
        });
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

  toggleLike(post: BlogPost) {
    if (post.liked) {
      post.likes--;
      post.liked = false;
    } else {
      post.likes++;
      post.liked = true;
    }
  }
}
