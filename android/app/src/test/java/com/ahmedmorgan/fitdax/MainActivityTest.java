package com.ahmedmorgan.fitdax;
import android.os.Bundle;
import android.view.ViewGroup;
import android.view.View;
import android.widget.TextView;
import android.widget.Button;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class)
@Config(sdk=34)
public class MainActivityTest {
 @Test public void coldStartWithoutBrowserShowsRecoveryInsteadOfCrashing(){
  try(var c=Robolectric.buildActivity(MainActivity.class).setup()){
   MainActivity a=c.get();assertFalse(a.isFinishing());
   assertTrue(text((ViewGroup)a.findViewById(android.R.id.content)).contains(a.getString(R.string.browser_missing)));
  }
 }
 @Test public void recreationKeepsRecoveryControlsAvailable(){
  try(var c=Robolectric.buildActivity(MainActivity.class).create(new Bundle()).start().resume()){
   MainActivity a=c.get();String content=text((ViewGroup)a.findViewById(android.R.id.content));
   assertTrue(content.contains(a.getString(R.string.open_browser)));assertTrue(content.contains("FitDax"));
  }
 }
 @Test @Config(qualifiers="ar") public void arabicLauncherUsesArabicRecoveryText(){
  try(var c=Robolectric.buildActivity(MainActivity.class).create(new Bundle()).start().resume()){
   MainActivity a=c.get();assertTrue(text((ViewGroup)a.findViewById(android.R.id.content)).contains("فتح في المتصفح"));
  }
 }
 private String text(ViewGroup group){StringBuilder out=new StringBuilder();for(int i=0;i<group.getChildCount();i++){View v=group.getChildAt(i);if(v instanceof TextView)out.append(((TextView)v).getText());if(v instanceof ViewGroup)out.append(text((ViewGroup)v));}return out.toString();}
}
