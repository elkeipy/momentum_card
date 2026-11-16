use tauri::{
  webview::{NewWindowResponse, PermissionKind, PermissionResponse},
  Url, WebviewUrl, WebviewWindowBuilder,
};

const APP_URL: &str = "https://elkeipy.github.io/momentum_card/";
const URL_OVERRIDE_ENV: &str = "MOMENTUM_URL";
const CALENDAR_HOST: &str = "calendar.google.com";
const CALENDAR_EVENT_PATH: &str = "/calendar/render";

// 앱이 새 창으로 여는 주소는 구글 캘린더 일정 작성 화면뿐이다.
fn is_calendar_event_url(url: &Url) -> bool {
  url.scheme() == "https"
    && url.host_str() == Some(CALENDAR_HOST)
    && url.path() == CALENDAR_EVENT_PATH
}

fn same_origin(a: &Url, b: &Url) -> bool {
  a.scheme() == b.scheme()
    && a.host_str() == b.host_str()
    && a.port_or_known_default() == b.port_or_known_default()
}

// 날씨 카드가 현재 위치를 쓴다. WebView2는 확인 창을 띄우지 않아 요청이 끝나지 않으므로
// 앱 주소가 보내는 위치 요청만 허용하고, 나머지는 기본 동작을 그대로 둔다.
fn permission_for(page: Option<&Url>, home: &Url, kind: PermissionKind) -> PermissionResponse {
  match (page, kind) {
    (Some(page), PermissionKind::Geolocation) if same_origin(page, home) => {
      PermissionResponse::Allow
    }
    _ => PermissionResponse::Default,
  }
}

fn app_url() -> Url {
  std::env::var(URL_OVERRIDE_ENV)
    .ok()
    .and_then(|value| value.parse().ok())
    .unwrap_or_else(|| APP_URL.parse().expect("APP_URL is a valid URL"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // 닫을 때의 크기와 위치를 저장하고 다시 켤 때 그대로 복원한다.
    .plugin(
      tauri_plugin_window_state::Builder::default()
        .with_state_flags(
          tauri_plugin_window_state::StateFlags::SIZE
            | tauri_plugin_window_state::StateFlags::POSITION
            | tauri_plugin_window_state::StateFlags::MAXIMIZED,
        )
        .build(),
    )
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      let home = app_url();
      let permission_home = home.clone();
      WebviewWindowBuilder::new(app, "main", WebviewUrl::External(home))
        .title("Momentum")
        .inner_size(1280.0, 900.0)
        .min_inner_size(800.0, 600.0)
        .on_permission_request(move |webview, kind| {
          permission_for(webview.url().ok().as_ref(), &permission_home, kind)
        })
        .on_new_window(|url, _features| {
          // 이 브라우저에 로그인된 구글 계정으로 열리도록 기본 브라우저에 넘긴다.
          if is_calendar_event_url(&url) {
            let _ = tauri_plugin_opener::open_url(url.as_str(), None::<&str>);
          }
          NewWindowResponse::Deny
        })
        .build()?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

#[cfg(test)]
mod tests {
  use super::*;

  fn url(value: &str) -> Url {
    value.parse().unwrap()
  }

  #[test]
  fn opens_only_the_calendar_event_editor() {
    assert!(is_calendar_event_url(&url(
      "https://calendar.google.com/calendar/render?action=TEMPLATE&text=lunch"
    )));
  }

  #[test]
  fn allows_geolocation_only_from_the_app_origin() {
    let home = url("https://elkeipy.github.io/momentum_card/");
    let from_app = url("https://elkeipy.github.io/momentum_card/#x");
    let other = url("https://evil.example/momentum_card/");
    let other_port = url("https://elkeipy.github.io:8443/momentum_card/");
    let allow = |page: Option<&Url>, kind| {
      matches!(permission_for(page, &home, kind), PermissionResponse::Allow)
    };
    assert!(allow(Some(&from_app), PermissionKind::Geolocation));
    assert!(!allow(Some(&other), PermissionKind::Geolocation));
    assert!(!allow(Some(&other_port), PermissionKind::Geolocation));
    assert!(!allow(None, PermissionKind::Geolocation));
    assert!(!allow(Some(&from_app), PermissionKind::Camera));
    assert!(!allow(Some(&from_app), PermissionKind::Microphone));
  }

  #[test]
  fn rejects_other_hosts_paths_and_schemes() {
    for rejected in [
      "https://calendar.google.com/calendar/u/0/r",
      "https://calendar.google.com.evil.example/calendar/render",
      "https://evil.example/calendar/render",
      "http://calendar.google.com/calendar/render",
      "file:///C:/Windows/System32/calc.exe",
      "javascript:alert(1)",
    ] {
      assert!(!is_calendar_event_url(&url(rejected)), "{rejected}");
    }
  }
}
