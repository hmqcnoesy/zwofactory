$doc = [xml](Get-Content $args[0]);
$ftp = [decimal]$args[1];
$name = $doc.workout_file.name;
$description = $doc.workout_file.description;
$elapsedMinutes = 0;
$segments = @();
$textcues = @();

write-output "[COURSE HEADER]";
write-output "VERSION = 2";
write-output "UNITS = ENGLISH";
write-output "DESCRIPTION = $description";
write-output "FILE NAME = $name";
write-output "FTP=$ftp";
write-output "MINUTES WATTS";
write-output "[END COURSE HEADER]";
write-output "[COURSE DATA]";

foreach($segment in $doc.workout_file.workout.ChildNodes) {
    
    foreach($textevent in $segment.textevent) {
        $textcues += "$(($elapsedMinutes*60) + $textevent.GetAttribute('timeoffset'))`t$($textevent.GetAttribute('message'))`t10";
    }

    $type = $segment.Name;

    if($type -eq 'Warmup' -or $type -eq 'Cooldown' -or $type -eq 'Ramp') {
        $powerLow = [decimal]$segment.GetAttribute('PowerLow');
        $powerHigh = [decimal]$segment.GetAttribute('PowerHigh');
        $duration = [int]$segment.GetAttribute('Duration');
        write-output "$($elapsedMinutes.toString('0.00'))`t$([math]::round($powerLow * $ftp, 0))";
        $elapsedMinutes += ($duration / 60);
        write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round($powerHigh * $ftp, 0))";
    } elseif ($type -eq 'IntervalsT') {
        $onPower = [decimal]$segment.GetAttribute('OnPower');
        $offPower = [decimal]$segment.GetAttribute('OffPower');
        $onDuration = [int]$segment.GetAttribute('OnDuration');
        $offDuration = [int]$segment.GetAttribute('OffDuration');
        $repeat = [int]$segment.GetAttribute('Repeat');
        
        for ($i = 0; $i -lt $repeat; $i++) {
            write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round($onPower * $ftp, 0))";
            $elapsedMinutes += ($onDuration / 60);
            write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round($onPower * $ftp, 0))";
            write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round($offPower * $ftp, 0))";
            $elapsedMinutes += ($offDuration / 60);
            write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round($offPower * $ftp, 0))";
        }

    } elseif ($type -eq 'FreeRide') {
        $duration = [int]$segment.GetAttribute('Duration');
        write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round(0.8 * $ftp, 0))";
        $elapsedMinutes += ($duration / 60);
        write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round(0.8 * $ftp, 0))";
    } else { 
        $power = [decimal]$segment.GetAttribute('Power');
        $duration = [int]$segment.GetAttribute('Duration');
        write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round($power * $ftp, 0))";
        $elapsedMinutes += ($duration / 60);
        write-output "$($elapsedMinutes.ToString('0.00'))`t$([math]::round($power * $ftp, 0))";
    }
}

write-output "[END COURSE DATA]";

if ($textcues.Count -gt 0) {
    write-output "[COURSE TEXT]";

    foreach($textcue in $textcues) {
        write-output $textcue;
    }

    write-output "[END COURSE TEXT]";
}
