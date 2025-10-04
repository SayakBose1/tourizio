import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  imageLoaded?: boolean;
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
})
export class BlogComponent implements OnInit {
  selectedCategory: string = 'All';
  currentFeaturedIndex: number = 0;

  categories = ['All', 'Adventure', 'Culture', 'Food', 'Tips', 'Nature'];

  blogPosts: BlogPost[] = [];
  featuredPosts: BlogPost[] = [];

  postsPerPage: number = 6;
  showAllPosts: boolean = false; // ✅ toggle flag

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>('assets/data/blogs.json').subscribe((data) => {
      this.blogPosts = data.blogPosts.map((post: BlogPost) => ({
        ...post,
        image: '',
        liked: false,
        imageLoaded: false,
      }));

      this.featuredPosts = [...this.blogPosts];
      this.loadImages();
    });

    setInterval(() => this.nextFeatured(), 5000);
  }

  loadImages() {
    const API_URL = 'https://api.pexels.com/v1/search';
    const headers = new HttpHeaders({
      Authorization: 'lziGnbzjpGpnwAGAu1KYKuJghDSuOVfworDozfcEESqesyoebEOalcTq',
    });

    const queries: { [key: number]: string } = {
      1: 'kerala famous location',
      2: 'delhi street food',
      3: 'himalaya trekking',
      4: 'tamil nadu temples',
      5: 'budget india ',
      6: 'amazon rainforest',
      7: 'norway fjords travel',
      8: 'marrakech souks market',
      9: 'tokyo restaurants street food',
      10: 'kenya safari wildlife',
      11: 'philippines island hopping beaches',
      12: 'cotswolds england countryside',
    };

    this.blogPosts.forEach((post, index) => {
      const query = queries[post.id] || 'travel';

      this.http
        .get<any>(API_URL, {
          headers,
          params: { query, per_page: 1 },
        })
        .subscribe((res) => {
          const newImage =
            res.photos[0]?.src.medium || 'https://via.placeholder.com/600x400';
          this.blogPosts[index].image = newImage;
          setTimeout(() => (this.blogPosts[index].imageLoaded = true), 50);
        });
    });
  }

  get filteredPosts() {
    const filtered =
      this.selectedCategory === 'All'
        ? this.blogPosts
        : this.blogPosts.filter((p) => p.category === this.selectedCategory);

    if (this.showAllPosts) {
      return filtered; // show all filtered posts
    } else {
      return filtered.slice(0, this.postsPerPage); // show only 6 posts
    }
  }

  setCategory(category: string) {
    this.selectedCategory = category;
    this.showAllPosts = false; // reset when category changes
  }

  loadMore() {
    this.showAllPosts = !this.showAllPosts; // toggle flag
    if (!this.showAllPosts) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    post.liked ? post.likes-- : post.likes++;
    post.liked = !post.liked;
  }

  openArticle(post: BlogPost) {
    // Create a search query based on post title and location
    const query = encodeURIComponent(`${post.title} ${post.location}`);
    // Open in a new tab using Google search
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  }
}
