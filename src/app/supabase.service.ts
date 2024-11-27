import { Injectable } from "@angular/core";
import { isPlatform, LoadingController, ToastController } from "@ionic/angular";
import {
  AuthChangeEvent,
  createClient,
  Session,
  SupabaseClient,
  RealtimeChannel,
} from "@supabase/supabase-js";
import { BehaviorSubject, Observable, Subscriber } from "rxjs";
import { environment } from "../environments/environment";

export interface Profile {
  avatar_url: string;
  name: string;
  last_name: string;
  second_last_name: string;
  address: string;
  address_number: string;
  comuna: string;
  region: string;
  apartment: string;
  full_name: string;
  is_registered: boolean;
}

export interface Vehicle {
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | null;
}

export interface RideRequest {
  id?: string;
  passenger_id: string;
  driver_id?: string;
  pickup_location: {
    lng: number;
    lat: number;
  };
  destination_location: {
    lng: number;
    lat: number;
  };
  status:
    | "pending"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "denied";
  created_at?: string;
}

interface CustomRealtimePayload<T> {
  old: T;
  new: T;
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: string;
}

export interface RideRequestInsert {
  passenger_id: string;
  pickup_location: { lng: number; lat: number };
  destination_location: { lng: number; lat: number };
  status:
    | "pending"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "denied";
}

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  supabase: SupabaseClient;

  private userTypeSubject = new BehaviorSubject<"passenger" | "driver" | null>(
    null,
  );
  userType$ = this.userTypeSubject.asObservable();

  private rideRequestsChannel: RealtimeChannel | null = null;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
    );

    this.supabase.auth.getSession().then(({ data: sessionData }) => {
      const session = sessionData.session;
      if (session?.user) {
        this.determineUserType(session.user.id)
          .then((type) => this.userTypeSubject.next(type))
          .catch((error) => {
            console.error("Error determining user type:", error);
            this.userTypeSubject.next(null);
          });
      } else {
        this.userTypeSubject.next(null);
      }
    });

    this.authChanges((event, session) => {
      if (session?.user) {
        this.determineUserType(session.user.id)
          .then((type) => this.userTypeSubject.next(type))
          .catch((error) => {
            console.error("Error determining user type:", error);
            this.userTypeSubject.next(null);
          });
      } else {
        this.userTypeSubject.next(null);
      }
    });
  }

  private async determineUserType(
    userId: string,
  ): Promise<"passenger" | "driver"> {
    const { data, error } = await this.supabase
      .from("drivers")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching driver data:", error);
      return "passenger";
    }

    return data ? "driver" : "passenger";
  }

  get user() {
    return this.supabase.auth.getUser().then(({ data }) => data.user);
  }

  get session() {
    return this.supabase.auth.getSession().then(({ data }) => data.session);
  }

  get profile() {
    return this.user
      .then((user) => user?.id)
      .then((id) =>
        this.supabase
          .from("profiles")
          .select(
            `avatar_url, name, last_name, second_last_name, address, address_number, comuna, region, apartment, full_name, is_registered`,
          )
          .eq("id", id)
          .single(),
      );
  }

  authChanges(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  signIn(email: string) {
    const redirectTo = isPlatform("capacitor")
      ? "duocapp://home"
      : `${window.location.origin}/home`;

    return this.supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
  }

  signInGoogle() {
    const redirectTo = isPlatform("capacitor")
      ? "duocapp://home"
      : `${window.location.origin}/home`;

    return this.supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo },
    });
  }

  async setSession(access_token: string, refresh_token: string) {
    return this.supabase.auth.setSession({ access_token, refresh_token });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  async updateProfile(profile: Profile) {
    const user = await this.user;
    const update = {
      name: profile.name,
      last_name: profile.last_name,
      second_last_name: profile.second_last_name,
      id: user?.id,
      updated_at: new Date(),
    };

    return this.supabase.from("profiles").upsert(update);
  }

  async createProfile(profile: Profile) {
    const user = await this.user;
    const update = {
      name: profile.name,
      last_name: profile.last_name,
      second_last_name: profile.second_last_name,
      id: user?.id,
      address: profile.address,
      address_number: profile.address_number,
      comuna: profile.comuna,
      region: profile.region,
      apartment: profile.apartment,
      is_registered: profile.is_registered,
      updated_at: new Date(),
    };

    return this.supabase.from("profiles").upsert(update);
  }

  async updateDriver(vehicle: Vehicle) {
    const user = await this.user;
    const update = {
      driver_id: user?.id,
      license_plate: vehicle.license_plate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      year: vehicle.year,
      updated_at: new Date(),
    };

    const { data } = await this.supabase
      .from("vehicles")
      .upsert(update)
      .select()
      .single();

    const driver = {
      id: user?.id,
      vehicle_id: await data?.id,
      created_at: new Date(),
    };

    return this.supabase.from("drivers").upsert(driver);
  }

  async updateAddress(profile: Profile) {
    const user = await this.user;
    const update = {
      address: profile.address,
      address_number: profile.address_number,
      comuna: profile.comuna,
      region: profile.region,
      apartment: profile.apartment,
      id: user?.id,
      updated_at: new Date(),
    };

    return this.supabase.from("profiles").upsert(update);
  }

  downLoadImage(path: string) {
    return this.supabase.storage.from("avatars").download(path);
  }

  async uploadAvatar(filePath: string, file: File) {
    const user = await this.user;
    const res = await this.supabase.storage
      .from("avatars")
      .upload(filePath, file);
    const res2 = await this.supabase
      .from("profiles")
      .upsert({ id: user?.id, avatar_url: filePath, updated_at: new Date() });
    return res;
  }

  async createRideRequest(rideRequest: RideRequest) {
    const { data, error } = await this.supabase
      .from("ride_requests")
      .insert(rideRequest);

    if (error) throw error;
    return data;
  }

  async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("No user found");
    return user.id;
  }

  getAvailableRideRequestsRealtime(): Observable<RideRequest[]> {
    return new Observable<RideRequest[]>(
      (observer: Subscriber<RideRequest[]>) => {
        const initialize = async () => {
          try {
            const currentUserId = await this.getCurrentUserId();

            const { data: deniedData, error: deniedError } = await this.supabase
              .from("denied_requests")
              .select("ride_request_id")
              .eq("driver_id", currentUserId);

            if (deniedError) throw deniedError;

            const deniedIds =
              deniedData?.map((item: any) => item.ride_request_id) || [];

            const { data, error } = await this.supabase
              .from("ride_requests")
              .select("*")
              .eq("status", "pending")
              .not("id", "in", `(${deniedIds.join(",")})`);

            if (error) throw error;

            const rideRequests = (data as RideRequest[]) || [];
            observer.next(rideRequests);

            this.rideRequestsChannel = this.supabase
              .channel("public:ride_requests")
              .on(
                "postgres_changes" as any,
                { event: "INSERT", schema: "public", table: "ride_requests" },
                (payload) => {
                  const newRide = payload.new as RideRequest;
                  if (!deniedIds.includes(newRide.id!)) {
                    rideRequests.push(newRide);
                    observer.next([...rideRequests]);
                  }
                },
              )
              .on(
                "postgres_changes" as any,
                { event: "UPDATE", schema: "public", table: "ride_requests" },
                (payload) => {
                  const updatedRide = payload.new as RideRequest;
                  const index = rideRequests.findIndex(
                    (ride) => ride.id === updatedRide.id,
                  );

                  if (updatedRide.status !== "pending") {
                    if (index > -1) {
                      rideRequests.splice(index, 1);
                      observer.next([...rideRequests]);
                    }
                  } else {
                    if (index > -1) {
                      rideRequests[index] = updatedRide;
                      observer.next([...rideRequests]);
                    } else if (!deniedIds.includes(updatedRide.id!)) {
                      rideRequests.push(updatedRide);
                      observer.next([...rideRequests]);
                    }
                  }
                },
              )
              .subscribe();
          } catch (error) {
            observer.error(error);
          }
        };

        initialize();

        return () => {
          if (this.rideRequestsChannel) {
            this.supabase.removeChannel(this.rideRequestsChannel);
          }
        };
      },
    );
  }

  async denyRideRequest(rideRequestId: string): Promise<void> {
    const driverId = await this.getCurrentUserId();

    const { error } = await this.supabase.from("denied_requests").insert([
      {
        driver_id: driverId,
        ride_request_id: rideRequestId,
      },
    ]);

    if (error) throw error;
  }

  getRideRequests(): Observable<RideRequest[]> {
    return this.getAvailableRideRequestsRealtime();
  }

  private async fetchPendingRides(): Promise<RideRequest[]> {
    const currentUserId = await this.getCurrentUserId();

    const { data: deniedData, error: deniedError } = await this.supabase
      .from("denied_requests")
      .select("ride_request_id")
      .eq("driver_id", currentUserId);

    if (deniedError) throw deniedError;

    const deniedIds = deniedData?.map((item) => item.ride_request_id) || [];

    const { data, error } = await this.supabase
      .from("ride_requests")
      .select("*")
      .eq("status", "pending")
      .not("id", "in", `(${deniedIds.join(",")})`);

    if (error) throw error;
    return data || [];
  }

  async updateRideRequest(requestId: string, updates: Partial<RideRequest>) {
    const { data, error } = await this.supabase
      .from("ride_requests")
      .update(updates)
      .eq("id", requestId);

    if (error) throw error;
    return data;
  }

  async createNotice(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 5000 });
    await toast.present();
  }

  createLoader() {
    return this.loadingCtrl.create();
  }

  async hasSession(): Promise<boolean> {
    const session = await this.session;
    return !!session;
  }
}
