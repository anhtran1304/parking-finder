import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingDetailResponse, BookingResponse, CreateBookingRequest, PageResponse } from '../../models/booking.model';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly authSessionService: AuthSessionService
  ) {}

  createBooking(request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/bookings`, request, {
      headers: this.authorizationHeaders(),
      withCredentials: true,
    });
  }

  getBooking(bookingId: number): Observable<BookingDetailResponse> {
    return this.http.get<BookingDetailResponse>(`${this.baseUrl}/bookings/${bookingId}`, {
      headers: this.authorizationHeaders(),
      withCredentials: true,
    });
  }

  getBookingHistory(page: number, size: number): Observable<PageResponse<BookingResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<PageResponse<BookingResponse>>(`${this.baseUrl}/bookings`, {
      headers: this.authorizationHeaders(),
      params,
      withCredentials: true,
    });
  }

  getActiveBooking(): Observable<BookingDetailResponse | null> {
    return this.http.get<BookingDetailResponse | null>(`${this.baseUrl}/bookings/active`, {
      headers: this.authorizationHeaders(),
      withCredentials: true,
    });
  }

  cancelBooking(bookingId: number): Observable<BookingResponse> {
    return this.http.patch<BookingResponse>(`${this.baseUrl}/bookings/${bookingId}/cancel`, null, {
      headers: this.authorizationHeaders(),
      withCredentials: true,
    });
  }

  private authorizationHeaders(): HttpHeaders {
    const token = this.authSessionService.getValidSession()?.accessToken;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
