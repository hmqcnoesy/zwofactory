$jsonFile = 'workouts.json'

New-Item $jsonFile -type file -force -value "["

$pwd = pwd
$pwd = $pwd.path
$zwos = ls *.zwo -R 

foreach($zwo in $zwos) {
    $cmd = "node convert.js """ + $zwo.fullname.replace($pwd + "\", "") + """"
    $zwo.fullname.replace($pwd + "\", "")
    $jsonData = iex $cmd 
    $jsonData = $jsonData.replace("{""name"":", "{""path"":""" + $zwo.fullname.replace($pwd + "\workouts\", "").replace("\", "\\") + """,""name"":") + ","
    $jsonData | add-content $jsonFile
}

add-content $jsonFile "]"