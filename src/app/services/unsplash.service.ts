import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnsplashService {
  private accessKey = 'GWcrtu8_uHrAmheYYvHYZSlVZoIFNGU1vTLMYHC0tOI';
  private apiUrl = 'https://api.unsplash.com/search/photos';

  constructor(private http: HttpClient) {}

  searchPhotos(query: string, perPage: number = 5): Observable<any> {
    const params = new HttpParams()
      .set('query', query)
      .set('client_id', this.accessKey)
      .set('per_page', perPage.toString());
    return this.http.get(this.apiUrl, { params });
  }
}
