# gcal-merger
- 複数のGoogleカレンダーを、ひとつの特定のカレンダーにマージします。
- Web UIより、マージの設定を変更できます。
- マージ元に追加/変更/削除があった場合は、マージ先も自動で追加/変更/削除されます。

## 注意
- 本アプリを使用したことによる、いかなる損害も補償しません。
 - 一部機能にてイベントの削除も実行されますので、テスト用のカレンダー等で挙動を確認してからご利用ください。
- 急ぎで作成したアプリのため、例外処理が疎かになっています。
- 繰り返しイベントに対する挙動が怪しいです。（修正のアイデア募集中）

## 導入方法

### 1. GoogleAppsScriptの新規プロジェクトを作成
Googleドライブにて 「新規 > その他 > Google Apps Script」 から新規のGASプロジェクトを作成する。

### 2. srcフォルダ配下のソースファイルを追加
1. 「ファイル > 新規作成 > スクリプトファイル or HTMLファイル」からファイルを新規作成
2. srcフォルダ配下のファイルをそれぞれコピペ
 - 「~.js」ファイルは、「スクリプトファイル」として作成する（「~.gs」の名前で作成される）
 - 「~.html」ファイルは、「HTMLファイル」として作成する
 - 「~.js」ファイルは、名前が一致していなくても良いが、「~.html」ファイルは

### 3. Webアプリケーションとして公開
1. 「公開 > Webアプリケーションとして導入」を選択する
2. 以下の設定を指定して「更新」
 - 「現在のウェブ アプリケーションの URL」のURLを控えておく
 - 「プロジェクト バージョン」 -> 新規作成
 - 「次のユーザーとしてアプリケーションを実行」 -> 自分
 - 「アプリケーションにアクセスできるユーザー」 -> 自分だけ

### 4. Webアプリケーションにアクセス
上記で控えたURLへアクセス

https://script.google.com/macros/s/[アプリごとに異なる]/exec

## 導入方法 (node-google-apps-scriptが使える場合)

### 1. GoogleAppsScriptの新規プロジェクトを作成
上と一緒

### 2. 作成したGASファイルのスクリプトID（ファイルID）を控える
「ファイル > プロジェクトのプロパティ > スクリプトID」を控える。

### 3. GitHubからclone して GASへupload

```sh-session
$ mkdir gcal-merger
$ cd gcal-merger
$ git clone git@github.com:ryskiwt/gcal-merger.git .
$ gapps init <スクリプトID>
$ git reset --hard origin/master
$ gapps upload
```

## 使用方法

### Settings

| 項目 | 備考 |
|:--|:--|
| Enable | 自動マージを実行するかどうか |
| Check Interval | ここに設定した時間間隔ごとに、カレンダーの変更チェックが走る |
| Duration to Check | 各変更チェックの時間を基準として、前後どれだけの期間をマージ対象とするか |


### Operation

#### MERGE now ボタン
「Date from」から「Date to」までの期間に対し、マージを手動実行します。
Settingsにて設定した内容に沿ってマージを実行するため、実行前に設定しておいてください。

#### CLEAN merged events ボタン
「Date from」から「Date to」までの期間に対し、マージ先カレンダーの全イベントを削除します。
