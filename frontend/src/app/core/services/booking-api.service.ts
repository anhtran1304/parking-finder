import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingResponse, CreateBookingRequest } from '../../models/booking.model';
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

  getBooking(bookingId: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/bookings/${bookingId}`, {
      headers: this.authorizationHeaders(),
      withCredentials: true,
    });
  }

  private authorizationHeaders(): HttpHeaders {
    const token = this.authSessionService.getValidSession()?.accessToken;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
