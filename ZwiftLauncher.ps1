$html = Invoke-WebRequest -Uri "http://community.zwift.com";
$data = $html.ParsedHtml.getElementById("calendar-data").innerHTML;
$json = $data | ConvertFrom-Json;

$today = Get-Date;
$year = $today.Year;
$month = $today.ToString("MMMM");
$day = $today.Day;
$map = "MAP NOT FOUND";

for ($i = 0; $i -lt $json.months.length; $i++) {
    for ($j = 0; $j -lt $json.months[$i].weeks.length; $j++) {
        for ($k = 0; $k -lt $json.months[$i].weeks[$j].days.length; $k++) {
            if ($json.months[$i].year -eq $year -and $json.months[$i].name -eq $month -and $json.months[$i].weeks[$j].days[$k].number -eq $day) {
                $map = $json.months[$i].weeks[$j].days[$k].map;
            }
        }
    }
}

$xmlfile = $env:userprofile + '\Documents\Zwift\prefs.xml';
$xml = [xml](Get-Content $xmlfile);
$rootNode = $xml.SelectSingleNode("/ZWIFT");
$worldNode = $rootNode.SelectSingleNode("WORLD");

Write-Host;
Write-Host -ForegroundColor Black -BackgroundColor Yellow "Today's group map is $map";
while ($newMapNumber -eq $null) {
    Write-Host "Press G to group ride or another key to solo ride:";
    Write-Host "(G)roup (W)atopia (R)ichmond (L)ondon (I)nnsbruck (N)ewYork";
    $key = $Host.UI.RawUI.ReadKey();
	Write-Host;

    if ($key.Character -eq 'w') { $newMapNumber = "1"; }
    if ($key.Character -eq 'r') { $newMapNumber = "2"; }
    if ($key.Character -eq 'l') { $newMapNumber = "3"; }
    if ($key.Character -eq 'n') { $newMapNumber = "4"; }
    if ($key.Character -eq 'i') { $newMapNumber = "5"; }
    if ($key.Character -eq 'g') { $newMapNumber = "0"; }
}

if ($key.Character -eq 'g') { 
    if ($worldNode -ne $null) {
        $noprint = $rootNode.RemoveChild($worldNode);
        $xml.Save($xmlfile);
    }
} else {
    if ($worldNode -eq $null) {
        $worldNode = $xml.CreateElement("WORLD");
        $noprint = $worldNode.AppendChild($xml.CreateTextNode($newMapNumber));
        $noprint = $rootNode.AppendChild($worldNode);
    } else {
        $worldNode.innerText = $newMapNumber;
    }
    $xml.Save($xmlfile);
}

Start-Process -FilePath "C:\Program Files (x86)\Zwift\ZwiftLauncher.exe" -WorkingDirectory "C:\Program Files (x86)\Zwift"
